"""Inbound webhook: ClickFunnels → our app.

When a user purchases via a ClickFunnels funnel:
- Verify HMAC signature
- Look up Supabase user by email (admin.auth.admin.list_users)
- If user exists -> activate Pro on profile (idempotent)
- If user does NOT exist -> create Supabase user (auto-confirm), then activate Pro
- Apply purchase tag back to ClickFunnels contact for cross-system visibility
- Never duplicate by email
"""
from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from auth_supabase import admin
from services import clickfunnels as cf

logger = logging.getLogger(__name__)

router = APIRouter(tags=["clickfunnels"])

# In-memory idempotency cache. For multi-instance deployments, replace with a
# Supabase clickfunnels_events table (mirroring the stripe_events pattern).
_PROCESSED_EVENT_IDS: set = set()
_PROCESSED_MAX = 1000


def _mark_processed(event_id: str) -> bool:
    """Return False if already processed (caller should skip)."""
    if not event_id:
        return True  # Process unknown-id events but skip dedupe.
    if event_id in _PROCESSED_EVENT_IDS:
        return False
    _PROCESSED_EVENT_IDS.add(event_id)
    if len(_PROCESSED_EVENT_IDS) > _PROCESSED_MAX:
        # Drop oldest half by reinitializing — simple bounded cache.
        _PROCESSED_EVENT_IDS.clear()
        _PROCESSED_EVENT_IDS.add(event_id)
    return True


def _find_supabase_user(email: str) -> Optional[dict]:
    """Find a user by email. Tries the profiles table first (indexed by email)
    and falls back to scanning auth users with pagination.
    Returns a dict with at least an `id` key, or None.
    """
    email_l = email.lower().strip()
    # Fast path: profiles table is keyed by email and indexed.
    try:
        res = admin.table("profiles").select("id,email,full_name").ilike("email", email_l).limit(1).execute()
        if res.data:
            row = res.data[0]
            return {"id": row["id"], "email": row.get("email"), "full_name": row.get("full_name")}
    except Exception as e:
        logger.warning("profiles lookup failed for %s: %s", email_l, e)

    # Fallback: paginate through auth users (slower but exhaustive).
    try:
        page = 1
        while page <= 20:  # safety cap (≤ 20 * 1000 = 20k users)
            res = admin.auth.admin.list_users(page=page, per_page=1000)
            users = getattr(res, "users", None) or (res.get("users") if isinstance(res, dict) else None) or []
            if not users:
                break
            for u in users:
                u_email = getattr(u, "email", None) or (u.get("email") if isinstance(u, dict) else None)
                if u_email and u_email.lower() == email_l:
                    return u
            if len(users) < 1000:
                break
            page += 1
    except Exception as e:
        logger.error("Supabase list_users failed: %s", e)
    return None


def _user_id(user_obj) -> Optional[str]:
    return getattr(user_obj, "id", None) or (user_obj.get("id") if isinstance(user_obj, dict) else None)


def _create_supabase_user(email: str, full_name: Optional[str]) -> Optional[str]:
    """Create a Supabase user with a random password + auto-confirm. Returns uid."""
    temp_password = secrets.token_urlsafe(24)
    try:
        res = admin.auth.admin.create_user({
            "email": email,
            "password": temp_password,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name or email.split("@")[0], "source": "clickfunnels_purchase"},
        })
        user = getattr(res, "user", None) or (res.get("user") if isinstance(res, dict) else None)
        return _user_id(user) if user else None
    except Exception as e:
        msg = str(e).lower()
        if any(k in msg for k in ("already", "exists", "registered", "duplicate")):
            # Race condition: another request created the user between our lookup
            # and create. Re-query to get the existing id.
            existing = _find_supabase_user(email)
            return _user_id(existing) if existing else None
        logger.error("Supabase create_user failed for %s: %s", email, e)
        return None


def _activate_pro(user_id: str, package: str) -> None:
    """Set profile.subscription_status = pro_lifetime (idempotent)."""
    try:
        # Fetch current state
        cur = admin.table("profiles").select("subscription_status,purchased_at").eq("id", user_id).limit(1).execute()
        if cur.data:
            current_status = cur.data[0].get("subscription_status")
            # Don't downgrade a lifetime member to monthly via this path.
            if current_status == "pro_lifetime":
                logger.info("Profile %s already pro_lifetime — skipping.", user_id)
                return

        update: Dict[str, Any] = {
            "subscription_status": "pro_lifetime" if package == "lifetime" else "pro_monthly",
            "purchased_at": datetime.now(timezone.utc).isoformat(),
        }
        if package == "lifetime":
            update["pro_until"] = None
        admin.table("profiles").update(update).eq("id", user_id).execute()
        logger.info("Activated %s for profile %s (via ClickFunnels webhook)", update["subscription_status"], user_id)
    except Exception as e:
        logger.error("Profile activation failed for %s: %s", user_id, e)


async def _process_purchase(event: Dict[str, Any]) -> None:
    """Background-safe handler: provision user + activate Pro + tag in CF."""
    email = event.get("email")
    if not email:
        logger.warning("CF webhook: no email in event %s; skipping", event.get("event_id"))
        return
    package = cf.package_from_amount(event.get("amount_cents"))
    full_name = event.get("full_name")

    user = _find_supabase_user(email)
    if user:
        uid = _user_id(user)
        logger.info("CF webhook: existing user %s (%s) — activating Pro", uid, email)
    else:
        uid = _create_supabase_user(email, full_name)
        if not uid:
            logger.error("CF webhook: failed to create user for %s", email)
            return
        logger.info("CF webhook: created new user %s for %s", uid, email)

    _activate_pro(uid, package)

    # Mirror the purchase tag back to CF for unified workflow targeting.
    try:
        await cf.sync_purchase(email, full_name, package)
    except Exception as e:
        logger.warning("CF tag-back failed for %s: %s", email, e)


@router.post("/webhook/clickfunnels")
async def clickfunnels_webhook(request: Request, background_tasks: BackgroundTasks):
    raw_body = await request.body()
    headers = dict(request.headers)

    # 1. Verify signature (skipped if CLICKFUNNELS_WEBHOOK_SECRET not configured)
    try:
        cf.verify_signature(raw_body, headers)
    except cf.SignatureError as e:
        logger.warning("CF webhook signature verification failed: %s", e)
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Parse JSON
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Expected JSON object")

    event = cf.parse_event(payload)
    event_id = event["event_id"]
    event_type = event["event_type"]

    # 3. Idempotency
    if not _mark_processed(event_id):
        logger.info("CF webhook: duplicate event %s — ignoring", event_id)
        return {"received": True, "duplicate": True}

    # 4. Dispatch
    if event["is_purchase"] or event.get("email"):
        # Purchase or contact-creation style event — provision user/Pro.
        background_tasks.add_task(_process_purchase, event)
        return {"received": True, "queued": True, "event_id": event_id, "event_type": event_type}

    logger.info("CF webhook: ignored event_type=%s (no email or non-purchase)", event_type)
    return {"received": True, "ignored": True, "event_type": event_type}
