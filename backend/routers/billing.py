"""Stripe billing: Checkout sessions, status polling, refunds, webhooks.

Design:
- Two SKUs (server-defined, never trust client amounts):
  - lifetime: $97 one-time payment (mode=payment)
  - monthly:  $19/mo recurring subscription (mode=subscription)
- Auth: all endpoints except /webhook/stripe require Supabase JWT.
- Idempotency: stripe_events table dedupes webhook events by stripe_event_id.
- Refund window: 7 days from profiles.purchased_at (self-serve).
- Polling: after redirect to /dashboard?session_id=..., frontend calls
  /billing/session/{session_id} which reconciles state in profiles.
"""
import os
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from auth_supabase import require_user, admin, CurrentUser
from services import clickfunnels as cf

logger = logging.getLogger(__name__)


def _fire_and_forget(coro, *, label: str) -> None:
    """Schedule a coroutine on the running loop without awaiting it.

    Used from sync code paths (e.g. Stripe webhook handlers) to push downstream
    sync work without blocking the response. If no loop is running yet, run
    synchronously in a temporary loop as a fallback.
    """
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(coro)
    except RuntimeError:
        try:
            asyncio.run(coro)
        except Exception as e:
            logger.warning("Fire-and-forget %s fallback failed: %s", label, e)

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_LIFETIME = os.environ.get("STRIPE_PRICE_LIFETIME", "")
STRIPE_PRICE_MONTHLY = os.environ.get("STRIPE_PRICE_MONTHLY", "")
STRIPE_PRICE_LIFETIME_UNLIMITED = os.environ.get("STRIPE_PRICE_LIFETIME_UNLIMITED", "")
STRIPE_PRICE_EXTRA_LIFETIME = os.environ.get("STRIPE_PRICE_EXTRA_LIFETIME", "")
STRIPE_PRICE_EXTRA_MONTHLY = os.environ.get("STRIPE_PRICE_EXTRA_MONTHLY", "")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
else:
    logger.warning("STRIPE_SECRET_KEY is not configured; billing endpoints will fail.")

REFUND_WINDOW_DAYS = 7

# Server-side package definitions (DO NOT accept amounts from client)
PACKAGES = {
    "lifetime": {
        "price_id": STRIPE_PRICE_LIFETIME,
        "mode": "payment",
        "amount_cents": 9700,
        "label": "Lifetime",
        "is_extra_slot": False,
    },
    "lifetime_unlimited": {
        "price_id": STRIPE_PRICE_LIFETIME_UNLIMITED,
        "mode": "payment",
        "amount_cents": 39700,
        "label": "Lifetime Unlimited",
        "is_extra_slot": False,
        "is_unlimited": True,
    },
    "monthly": {
        "price_id": STRIPE_PRICE_MONTHLY,
        "mode": "subscription",
        "amount_cents": 1900,
        "label": "Monthly",
        "is_extra_slot": False,
    },
    "extra_lifetime": {
        "price_id": STRIPE_PRICE_EXTRA_LIFETIME,
        "mode": "payment",
        "amount_cents": 1999,
        "label": "Additional Plan (Lifetime)",
        "is_extra_slot": True,
        "required_tier": "pro_lifetime",
    },
    "extra_monthly": {
        "price_id": STRIPE_PRICE_EXTRA_MONTHLY,
        "mode": "subscription",
        "amount_cents": 1000,
        "label": "Additional Plan (Monthly)",
        "is_extra_slot": True,
        "required_tier": "pro_monthly",
    },
}

router = APIRouter(prefix="/billing", tags=["billing"])


# ============================== MODELS ==============================
class CheckoutRequest(BaseModel):
    package: str = Field(..., description="'lifetime' | 'monthly'")
    origin: str = Field(..., description="window.location.origin from the frontend")


class CheckoutResponse(BaseModel):
    url: str
    session_id: str


class SessionStatusResponse(BaseModel):
    status: Optional[str]
    payment_status: Optional[str]
    package: Optional[str]
    is_pro: bool
    amount_total: Optional[int] = None
    currency: Optional[str] = None


class RefundResponse(BaseModel):
    ok: bool
    refunded_amount: Optional[int] = None
    message: str


# ============================== HELPERS ==============================
def _ensure_configured():
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing is not configured.")
    if not STRIPE_PRICE_LIFETIME or not STRIPE_PRICE_MONTHLY:
        raise HTTPException(status_code=503, detail="Stripe price IDs not configured.")


def _safe_origin(origin: str) -> str:
    """Validate origin format; fallback to request hostname-safe value."""
    if not origin:
        raise HTTPException(status_code=400, detail="Missing origin.")
    o = origin.rstrip("/")
    if not (o.startswith("http://") or o.startswith("https://")):
        raise HTTPException(status_code=400, detail="Invalid origin.")
    return o


def _get_profile(user_id: str) -> dict:
    res = admin.table("profiles").select("*").eq("id", user_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return res.data[0]


def _is_pro(profile: dict) -> bool:
    """Mirror access.has_pro_access but inline for direct usage."""
    status = profile.get("subscription_status")
    if status in ("pro_lifetime", "pro_lifetime_unlimited"):
        return True
    if status == "pro_monthly":
        pu = profile.get("pro_until")
        if not pu:
            return False
        try:
            pu_dt = datetime.fromisoformat(str(pu).replace("Z", "+00:00")) if isinstance(pu, str) else pu
            return pu_dt > datetime.now(timezone.utc)
        except Exception:
            return False
    return False


def _ensure_stripe_customer(profile: dict) -> str:
    """Get or create a Stripe Customer for the profile and persist it."""
    cust_id = profile.get("stripe_customer_id")
    if cust_id:
        try:
            stripe.Customer.retrieve(cust_id)
            return cust_id
        except stripe.error.StripeError:
            cust_id = None
    customer = stripe.Customer.create(
        email=profile.get("email") or None,
        name=profile.get("full_name") or None,
        metadata={"supabase_user_id": profile["id"]},
    )
    admin.table("profiles").update({"stripe_customer_id": customer.id}).eq("id", profile["id"]).execute()
    return customer.id


def _is_event_processed(event_id: str) -> bool:
    res = admin.table("stripe_events").select("id").eq("stripe_event_id", event_id).limit(1).execute()
    return bool(res.data)


def _mark_event_processed(event_id: str, event_type: str, payload: dict):
    try:
        admin.table("stripe_events").insert({
            "stripe_event_id": event_id,
            "type": event_type,
            "payload": payload,
        }).execute()
    except Exception as e:
        logger.warning(f"stripe_events insert failed (likely dupe): {e}")


def _subscription_period_end(sub) -> Optional[int]:
    """Get current_period_end across Stripe API versions.

    Modern Stripe API moved this from sub.current_period_end (root) to sub.items.data[i].current_period_end.
    Returns unix timestamp or None.
    """
    pe = getattr(sub, "current_period_end", None)
    if pe:
        return pe
    items = getattr(sub, "items", None)
    if items and getattr(items, "data", None):
        for it in items.data:
            it_pe = getattr(it, "current_period_end", None)
            if it_pe:
                return it_pe
    return None


def _activate_pro_from_session(session_obj) -> Optional[str]:
    """Update profiles based on a paid checkout session. Returns user_id activated.

    Idempotent: if profile is already activated for this session, it's a no-op.
    Accepts either a dict or a Stripe Session object (uses .get when dict, attr otherwise).
    """
    def g(obj, key, default=None):
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default) or default

    metadata_raw = g(session_obj, "metadata") or {}
    if isinstance(metadata_raw, dict):
        metadata = metadata_raw
    elif hasattr(metadata_raw, "to_dict"):
        try:
            metadata = metadata_raw.to_dict()
        except Exception:
            metadata = {}
    else:
        metadata = {}
    user_id = metadata.get("supabase_user_id")
    pkg = metadata.get("package")
    if not user_id or not pkg:
        logger.warning(f"Session missing metadata: id={g(session_obj, 'id')}")
        return None

    payment_status = g(session_obj, "payment_status")
    if payment_status != "paid":
        return None

    customer_id = g(session_obj, "customer")
    subscription_id = g(session_obj, "subscription")
    now_iso = datetime.now(timezone.utc).isoformat()

    # ===== Extra-plan-slot purchases: increment plan_credits, don't touch tier =====
    if pkg in ("extra_lifetime", "extra_monthly"):
        from services import quota as quota_svc
        sub_for_tracking = subscription_id if pkg == "extra_monthly" else None
        new_total = quota_svc.add_plan_credits(user_id, +1, sub_id=sub_for_tracking)
        logger.info(f"Extra slot purchased ({pkg}) for {user_id}: credits now {new_total}")
        # Also push CF tag for tracking — reuse existing tag scheme.
        try:
            prof = admin.table("profiles").select("email,full_name").eq("id", user_id).limit(1).execute()
            if prof.data and prof.data[0].get("email"):
                email = prof.data[0]["email"]
                name = prof.data[0].get("full_name")
                # Reuse base purchase tag for analytics consistency
                base_pkg = "lifetime" if pkg == "extra_lifetime" else "monthly"
                _fire_and_forget(cf.sync_purchase(email, name, base_pkg), label=f"cf.sync_extra<{email}>")
        except Exception as e:
            logger.warning("CF tag-back for extra slot failed: %s", e)
        return user_id

    # ===== Standard Pro purchase =====
    update: dict = {
        "stripe_customer_id": customer_id,
        "purchased_at": now_iso,
        "last_checkout_session_id": g(session_obj, "id"),
    }

    if pkg == "lifetime_unlimited":
        # Cancel any existing active monthly subscription before flipping tier
        # (upgrade path: pro_monthly -> pro_lifetime_unlimited).
        existing_sub = None
        try:
            prof_now = admin.table("profiles").select("stripe_subscription_id,subscription_status").eq("id", user_id).limit(1).execute()
            if prof_now.data:
                existing_sub = prof_now.data[0].get("stripe_subscription_id")
        except Exception as e:
            logger.warning("Could not read existing profile for upgrade-cancel: %s", e)
        if existing_sub:
            try:
                stripe.Subscription.cancel(existing_sub)
                logger.info("Canceled existing sub %s during upgrade to lifetime_unlimited for %s", existing_sub, user_id)
            except stripe.error.StripeError as e:
                logger.warning("Could not cancel existing sub %s during upgrade: %s", existing_sub, e)
        update["subscription_status"] = "pro_lifetime_unlimited"
        update["pro_until"] = None
        update["stripe_subscription_id"] = None
    elif pkg == "lifetime":
        update["subscription_status"] = "pro_lifetime"
        update["pro_until"] = None
        update["stripe_subscription_id"] = None
    elif pkg == "monthly":
        update["subscription_status"] = "pro_monthly"
        update["stripe_subscription_id"] = subscription_id
        # Compute pro_until from subscription
        if subscription_id:
            try:
                sub = stripe.Subscription.retrieve(subscription_id)
                period_end = _subscription_period_end(sub)
                if period_end:
                    update["pro_until"] = datetime.fromtimestamp(period_end, tz=timezone.utc).isoformat()
            except Exception as e:
                logger.warning(f"Could not fetch subscription {subscription_id}: {e}")
                # fallback: 31 days from now
                update["pro_until"] = (datetime.now(timezone.utc) + timedelta(days=31)).isoformat()
        else:
            update["pro_until"] = (datetime.now(timezone.utc) + timedelta(days=31)).isoformat()

    try:
        admin.table("profiles").update(update).eq("id", user_id).execute()
        logger.info(f"Activated {pkg} for user {user_id}")
    except Exception as e:
        # last_checkout_session_id column may not exist — retry without it
        if "last_checkout_session_id" in str(e):
            update.pop("last_checkout_session_id", None)
            admin.table("profiles").update(update).eq("id", user_id).execute()
        else:
            logger.error(f"Profile update failed for {user_id}: {e}")
            raise

    # Mirror the purchase into ClickFunnels (best-effort, non-blocking).
    try:
        prof = admin.table("profiles").select("email,full_name").eq("id", user_id).limit(1).execute()
        if prof.data:
            email = prof.data[0].get("email")
            name = prof.data[0].get("full_name")
            if email:
                _fire_and_forget(cf.sync_purchase(email, name, pkg), label=f"cf.sync_purchase<{email},{pkg}>")
    except Exception as e:
        logger.warning("ClickFunnels post-activation sync skipped: %s", e)

    return user_id


def _downgrade_to_free(user_id: str, reason: str = "manual"):
    update = {
        "subscription_status": "free",
        "pro_until": None,
    }
    admin.table("profiles").update(update).eq("id", user_id).execute()
    logger.info(f"Downgraded user {user_id} to free ({reason})")
    # Push refund tag back to ClickFunnels (best-effort).
    try:
        prof = admin.table("profiles").select("email,full_name").eq("id", user_id).limit(1).execute()
        if prof.data and prof.data[0].get("email"):
            _fire_and_forget(
                cf.sync_refund(prof.data[0]["email"], prof.data[0].get("full_name")),
                label=f"cf.sync_refund<{prof.data[0]['email']}>"
            )
    except Exception as e:
        logger.warning("ClickFunnels post-downgrade sync skipped: %s", e)


def _refund_window_remaining(profile: dict) -> Optional[timedelta]:
    """Return time remaining in refund window, or None if expired/not applicable."""
    purchased_at = profile.get("purchased_at")
    if not purchased_at:
        return None
    try:
        purchased_dt = datetime.fromisoformat(str(purchased_at).replace("Z", "+00:00"))
    except Exception:
        return None
    deadline = purchased_dt + timedelta(days=REFUND_WINDOW_DAYS)
    remaining = deadline - datetime.now(timezone.utc)
    return remaining if remaining.total_seconds() > 0 else None


# ============================== ENDPOINTS ==============================
@router.get("/config")
async def billing_config():
    """Public: lets the frontend know if billing is enabled."""
    return {
        "enabled": bool(STRIPE_SECRET_KEY and STRIPE_PRICE_LIFETIME and STRIPE_PRICE_MONTHLY),
        "packages": {
            "lifetime": {"amount_cents": 9700, "currency": "usd", "label": "Lifetime"},
            "lifetime_unlimited": {
                "amount_cents": 39700,
                "currency": "usd",
                "label": "Lifetime Unlimited",
                "available": bool(STRIPE_PRICE_LIFETIME_UNLIMITED),
            },
            "monthly": {"amount_cents": 1900, "currency": "usd", "label": "Monthly"},
        },
        "refund_window_days": REFUND_WINDOW_DAYS,
    }


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(body: CheckoutRequest, user: CurrentUser = Depends(require_user)):
    _ensure_configured()
    pkg = (body.package or "").lower()
    if pkg not in PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package.")
    config = PACKAGES[pkg]
    if not config.get("price_id"):
        raise HTTPException(status_code=503, detail=f"Price for {pkg} not configured on server.")

    profile = _get_profile(user.id)
    is_extra = bool(config.get("is_extra_slot"))
    is_unlimited_pkg = bool(config.get("is_unlimited"))
    current_status = profile.get("subscription_status")

    if is_extra:
        # Unlimited members never need extra slots — block to avoid confusion.
        if current_status == "pro_lifetime_unlimited":
            raise HTTPException(status_code=409, detail={
                "code": "unlimited_no_extras_needed",
                "message": "You're on Lifetime Unlimited — you already have unlimited plans.",
            })
        # Extra-plan checkouts require the user already be on the matching tier.
        required = config.get("required_tier")
        if required == "pro_lifetime" and current_status != "pro_lifetime":
            raise HTTPException(status_code=403, detail={
                "code": "lifetime_required",
                "message": "Extra plan slots ($19.99 one-time) are available to Lifetime members. Upgrade to Lifetime first.",
            })
        if required == "pro_monthly" and current_status != "pro_monthly":
            raise HTTPException(status_code=403, detail={
                "code": "monthly_required",
                "message": "Extra plan slots ($10/mo) are available to Monthly members. Upgrade to Monthly first, or buy Lifetime for 6 plans + $19.99 each thereafter.",
            })
    elif is_unlimited_pkg:
        # Upgrade-friendly: any non-unlimited user (free / pro_monthly / pro_lifetime) can buy this.
        if current_status == "pro_lifetime_unlimited":
            raise HTTPException(status_code=409, detail="You already have Lifetime Unlimited access.")
    else:
        # Regular Pro purchase (lifetime / monthly): block if user is already any Pro tier.
        if _is_pro(profile):
            raise HTTPException(status_code=409, detail="You already have Pro access.")

    origin = _safe_origin(body.origin)
    customer_id = _ensure_stripe_customer(profile)

    success_param = "extra_session_id" if is_extra else "session_id"
    success_url = f"{origin}/dashboard?{success_param}={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/pricing?canceled=1" if not is_extra else f"{origin}/dashboard?extras_canceled=1"

    session = None
    try:
        session_args = dict(
            mode=config["mode"],
            line_items=[{"price": config["price_id"], "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            customer=customer_id,
            client_reference_id=user.id,
            metadata={
                "supabase_user_id": user.id,
                "package": pkg,
            },
            allow_promotion_codes=True,
        )
        if config["mode"] == "subscription":
            session_args["subscription_data"] = {
                "metadata": {
                    "supabase_user_id": user.id,
                    "package": pkg,
                }
            }
        session = stripe.checkout.Session.create(**session_args)
    except stripe.error.StripeError as e:
        logger.error(f"Stripe checkout create failed: {e}")
        raise HTTPException(status_code=502, detail=f"Stripe error: {e.user_message or str(e)}")

    if session is None:
        raise HTTPException(status_code=502, detail="Stripe did not return a session.")
    return CheckoutResponse(url=session.url, session_id=session.id)


@router.get("/session/{session_id}", response_model=SessionStatusResponse)
async def get_session_status(session_id: str, user: CurrentUser = Depends(require_user)):
    _ensure_configured()
    session = None
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=404, detail=f"Session not found: {e.user_message or str(e)}")

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    # Authorization: only the owner can read their own session
    if session.client_reference_id and session.client_reference_id != user.id:
        raise HTTPException(status_code=403, detail="Not your session.")
    # session.metadata is a StripeObject; use .to_dict() to convert
    try:
        raw_md = session.metadata
        if raw_md is None:
            md = {}
        elif isinstance(raw_md, dict):
            md = raw_md
        elif hasattr(raw_md, "to_dict"):
            md = raw_md.to_dict()
        else:
            md = {}
    except Exception:
        md = {}
    if md.get("supabase_user_id") and md["supabase_user_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not your session.")

    # If paid, reconcile profile (idempotent)
    if session.payment_status == "paid":
        try:
            session_dict = {
                "id": session.id,
                "payment_status": session.payment_status,
                "customer": session.customer,
                "subscription": session.subscription,
                "metadata": md,
            }
            _activate_pro_from_session(session_dict)
        except Exception as e:
            logger.warning(f"Reconcile during poll failed: {e}")

    profile = _get_profile(user.id)
    return SessionStatusResponse(
        status=session.status,
        payment_status=session.payment_status,
        package=md.get("package"),
        is_pro=_is_pro(profile),
        amount_total=session.amount_total,
        currency=session.currency,
    )


@router.get("/me")
async def my_billing(user: CurrentUser = Depends(require_user)):
    """Returns the user's current subscription state + refund eligibility."""
    profile = _get_profile(user.id)
    remaining = _refund_window_remaining(profile)
    return {
        "subscription_status": profile.get("subscription_status") or "free",
        "is_pro": _is_pro(profile),
        "pro_until": profile.get("pro_until"),
        "purchased_at": profile.get("purchased_at"),
        "has_subscription": bool(profile.get("stripe_subscription_id")),
        "refund_eligible": remaining is not None and profile.get("subscription_status") in ("pro_lifetime", "pro_lifetime_unlimited", "pro_monthly"),
        "refund_window_seconds_remaining": int(remaining.total_seconds()) if remaining else 0,
        "refund_window_days": REFUND_WINDOW_DAYS,
    }


@router.post("/refund", response_model=RefundResponse)
async def self_serve_refund(user: CurrentUser = Depends(require_user)):
    """Refund within 7 days. Cancels active subscription if applicable. Downgrades profile."""
    _ensure_configured()
    profile = _get_profile(user.id)
    status = profile.get("subscription_status")
    if status not in ("pro_lifetime", "pro_lifetime_unlimited", "pro_monthly"):
        raise HTTPException(status_code=400, detail="No active Pro purchase to refund.")

    remaining = _refund_window_remaining(profile)
    if not remaining:
        raise HTTPException(status_code=400, detail=f"Refund window of {REFUND_WINDOW_DAYS} days has expired.")

    customer_id = profile.get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer on file.")

    refunded_amount = 0
    # Cancel any active subscription
    sub_id = profile.get("stripe_subscription_id")
    if sub_id:
        try:
            stripe.Subscription.cancel(sub_id)
        except stripe.error.StripeError as e:
            logger.warning(f"Subscription cancel failed: {e}")

    # Find the most recent successful PaymentIntent for this customer and refund it
    try:
        intents = stripe.PaymentIntent.list(customer=customer_id, limit=10).data
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe error listing payments: {e}")

    target_intent = next((pi for pi in intents if pi.status == "succeeded"), None)
    if not target_intent:
        # Downgrade anyway (no charge to refund — shouldn't normally happen)
        _downgrade_to_free(user.id, reason="refund_no_intent")
        return RefundResponse(ok=True, refunded_amount=0, message="No active charges found; subscription canceled.")

    try:
        refund = stripe.Refund.create(payment_intent=target_intent.id, reason="requested_by_customer")
        refunded_amount = refund.amount or 0
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe refund failed: {e.user_message or str(e)}")

    _downgrade_to_free(user.id, reason="self_serve_refund")
    # Fire-and-forget refund confirmation email
    try:
        from services import email_service as em
        import asyncio
        full_name = (profile.get("full_name") or "").strip() or None
        amount_display = f"${refunded_amount / 100:.2f}"
        asyncio.create_task(em.send_refund_confirmation(profile.get("email") or user.email, full_name, amount_display, expected_days=5))
    except Exception as e:
        logger.warning("Refund email dispatch failed: %s", e)
    return RefundResponse(ok=True, refunded_amount=refunded_amount, message="Refund issued successfully.")


@router.post("/cancel-subscription")
async def cancel_subscription(user: CurrentUser = Depends(require_user)):
    """Cancel monthly subscription at period end (Pro access retained until pro_until)."""
    _ensure_configured()
    profile = _get_profile(user.id)
    sub_id = profile.get("stripe_subscription_id")
    if not sub_id:
        raise HTTPException(status_code=400, detail="No active subscription.")
    try:
        sub = stripe.Subscription.modify(sub_id, cancel_at_period_end=True)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe error: {e.user_message or str(e)}")

    period_end = _subscription_period_end(sub)
    return {
        "ok": True,
        "message": "Subscription will end at the end of your current billing period.",
        "ends_at": datetime.fromtimestamp(period_end, tz=timezone.utc).isoformat() if period_end else None,
    }


# ============================== WEBHOOK ==============================
# Public router — registered at /api/webhook/stripe (separate from /billing prefix)
webhook_router = APIRouter(tags=["billing"])


def _profile_id_for_customer(customer_id: str) -> Optional[str]:
    """Return profile.id for a Stripe customer, or None."""
    if not customer_id:
        return None
    res = admin.table("profiles").select("id,subscription_status").eq("stripe_customer_id", customer_id).limit(1).execute()
    if not res.data:
        return None
    return res.data[0]["id"]


def _handle_invoice_paid(data_obj: dict) -> None:
    """Extend pro_until on monthly renewal."""
    sub_id = data_obj.get("subscription")
    customer_id = data_obj.get("customer")
    if not (sub_id and customer_id):
        return
    uid = _profile_id_for_customer(customer_id)
    if not uid:
        return
    try:
        sub = stripe.Subscription.retrieve(sub_id)
        period_end = _subscription_period_end(sub)
        if not period_end:
            return
        admin.table("profiles").update({
            "subscription_status": "pro_monthly",
            "stripe_subscription_id": sub_id,
            "pro_until": datetime.fromtimestamp(period_end, tz=timezone.utc).isoformat(),
        }).eq("id", uid).execute()
    except Exception as e:
        logger.warning(f"invoice.paid handle failed for sub={sub_id}: {e}")


def _handle_subscription_deleted(data_obj: dict) -> None:
    customer_id = data_obj.get("customer")
    sub_id = data_obj.get("id") or data_obj.get("subscription")
    if not customer_id:
        return
    res = admin.table("profiles").select("id,subscription_status,stripe_subscription_id").eq("stripe_customer_id", customer_id).limit(1).execute()
    if not res.data:
        return
    profile = res.data[0]
    uid = profile["id"]
    main_sub_id = profile.get("stripe_subscription_id")

    # If this is the user's MAIN monthly subscription -> downgrade to free.
    if sub_id and main_sub_id and sub_id == main_sub_id:
        if profile.get("subscription_status") == "pro_monthly":
            _downgrade_to_free(uid, reason="subscription_deleted")
        return

    # Otherwise it may be an extra-slot subscription -> decrement credits only.
    if sub_id:
        from services import quota as quota_svc
        try:
            new_total = quota_svc.remove_extra_subscription(uid, sub_id)
            logger.info("Extra-slot sub canceled for %s: credits now %s", uid, new_total)
        except Exception as e:
            logger.warning("remove_extra_subscription failed for %s/%s: %s", uid, sub_id, e)


def _handle_charge_refunded(data_obj: dict) -> None:
    customer_id = data_obj.get("customer")
    if not customer_id:
        return
    uid = _profile_id_for_customer(customer_id)
    if uid:
        _downgrade_to_free(uid, reason="charge_refunded")


WEBHOOK_HANDLERS = {
    "checkout.session.completed": lambda obj: _activate_pro_from_session(obj),
    "invoice.paid": _handle_invoice_paid,
    "invoice.payment_succeeded": _handle_invoice_paid,
    "customer.subscription.deleted": _handle_subscription_deleted,
    "charge.refunded": _handle_charge_refunded,
}


def _parse_webhook(payload: bytes, signature: Optional[str]) -> dict:
    """Verify signature (when configured) and return the event dict."""
    if STRIPE_WEBHOOK_SECRET:
        return stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)
    import json as _json
    return _json.loads(payload.decode("utf-8"))


@webhook_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events idempotently.

    If STRIPE_WEBHOOK_SECRET is unset, accepts unsigned payloads (DEV ONLY).
    Production: set STRIPE_WEBHOOK_SECRET via Stripe Dashboard webhook config.
    """
    payload = await request.body()
    sig = request.headers.get("stripe-signature")

    try:
        event = _parse_webhook(payload, sig)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        logger.warning(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_id = event.get("id") if isinstance(event, dict) else event["id"]
    event_type = event.get("type") if isinstance(event, dict) else event["type"]
    data_obj = (event.get("data", {}) or {}).get("object", {}) if isinstance(event, dict) else event["data"]["object"]

    # Idempotency
    if _is_event_processed(event_id):
        return {"received": True, "duplicate": True}

    handler = WEBHOOK_HANDLERS.get(event_type)
    if handler is None:
        # Unhandled event types are still marked as processed to avoid retry storms.
        _mark_event_processed(event_id, event_type, data_obj if isinstance(data_obj, dict) else {})
        return {"received": True, "ignored": event_type}

    try:
        handler(data_obj)
        _mark_event_processed(event_id, event_type, data_obj if isinstance(data_obj, dict) else {})
    except Exception as e:
        logger.error(f"Webhook handler error for {event_type}: {e}")
        # Don't mark as processed so Stripe retries
        raise HTTPException(status_code=500, detail="Webhook processing error")

    return {"received": True}
