"""ClickFunnels 2.0 API client + webhook utilities.

All API calls are non-blocking from the user's perspective: they're invoked
from FastAPI BackgroundTasks (or asyncio.create_task in webhooks) so that
signup/purchase responses are not delayed by remote API latency.

Idempotency:
- Contact upsert: search by email_address first; create only if not found.
- Tag application: find-or-create tag by name; apply to contact. ClickFunnels
  applied_tags are themselves idempotent — re-applying the same tag is a no-op.
- Pro activation from webhook: only flips profile fields if not already Pro.

Public surface:
- upsert_contact(email, full_name) -> contact_id | None
- apply_tag(contact_id, tag_name) -> bool
- sync_signup(email, full_name) -> coroutine (background-friendly)
- sync_purchase(email, full_name, package) -> coroutine
- sync_refund(email) -> coroutine
- verify_signature(body, headers) -> raises ValueError on bad sig
- parse_event(payload) -> dict (normalized)
"""
from __future__ import annotations

import hmac
import hashlib
import json
import logging
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx

logger = logging.getLogger(__name__)

# ---------- Config ----------
CLICKFUNNELS_API_TOKEN = os.environ.get("CLICKFUNNELS_API_TOKEN", "").strip()
CLICKFUNNELS_WORKSPACE_ID = os.environ.get("CLICKFUNNELS_WORKSPACE_ID", "").strip()
CLICKFUNNELS_WORKSPACE_SUBDOMAIN = os.environ.get("CLICKFUNNELS_WORKSPACE_SUBDOMAIN", "").strip()
CLICKFUNNELS_WEBHOOK_SECRET = os.environ.get("CLICKFUNNELS_WEBHOOK_SECRET", "").strip()
CLICKFUNNELS_USER_AGENT = os.environ.get("CLICKFUNNELS_USER_AGENT", "InfluenceIncubator/1.0").strip()

TAG_SIGNUP = os.environ.get("CLICKFUNNELS_TAG_SIGNUP", "incubator_formula_signup").strip()
TAG_PURCHASE_LIFETIME = os.environ.get("CLICKFUNNELS_TAG_LIFETIME", "iif_purchased_lifetime").strip()
TAG_PURCHASE_MONTHLY = os.environ.get("CLICKFUNNELS_TAG_MONTHLY", "iif_purchased_monthly").strip()
TAG_REFUNDED = os.environ.get("CLICKFUNNELS_TAG_REFUNDED", "iif_refunded").strip()

WEBHOOK_TOLERANCE_SECONDS = 600

# Cache for tag id lookups within the running process (avoid repeated find calls).
_TAG_ID_CACHE: Dict[str, int] = {}


def is_configured() -> bool:
    return bool(CLICKFUNNELS_API_TOKEN and CLICKFUNNELS_WORKSPACE_ID and CLICKFUNNELS_WORKSPACE_SUBDOMAIN)


def _base_url() -> str:
    return f"https://{CLICKFUNNELS_WORKSPACE_SUBDOMAIN}/api/v2"


def _headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {CLICKFUNNELS_API_TOKEN}",
        "User-Agent": CLICKFUNNELS_USER_AGENT,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


# ---------- Low-level HTTP helpers ----------
async def _request(method: str, path: str, *, params: Optional[Dict[str, Any]] = None, json_body: Optional[Dict[str, Any]] = None, timeout: float = 12.0) -> Tuple[int, Any]:
    url = f"{_base_url()}{path}"
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.request(method, url, params=params, json=json_body, headers=_headers())
        try:
            data = resp.json()
        except Exception:
            data = resp.text
        return resp.status_code, data
    except httpx.HTTPError as e:
        logger.error("ClickFunnels HTTP error %s %s: %s", method, path, e)
        return 0, {"error": str(e)}


# ---------- Contacts ----------
def _split_name(full_name: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    if not full_name:
        return None, None
    parts = full_name.strip().split(None, 1)
    first = parts[0] if parts else None
    last = parts[1] if len(parts) > 1 else None
    return first, last


async def find_contact_by_email(email: str) -> Optional[Dict[str, Any]]:
    status, data = await _request("GET", f"/workspaces/{CLICKFUNNELS_WORKSPACE_ID}/contacts", params={"filter[email_address]": email})
    if status == 200 and isinstance(data, list) and data:
        return data[0]
    return None


async def create_contact(email: str, full_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
    first, last = _split_name(full_name)
    body: Dict[str, Any] = {"contact": {"email_address": email}}
    if first:
        body["contact"]["first_name"] = first
    if last:
        body["contact"]["last_name"] = last
    status, data = await _request("POST", f"/workspaces/{CLICKFUNNELS_WORKSPACE_ID}/contacts", json_body=body)
    if status in (200, 201) and isinstance(data, dict) and data.get("id"):
        return data
    logger.warning("ClickFunnels create_contact failed (%s): %s", status, data)
    return None


async def upsert_contact(email: str, full_name: Optional[str] = None) -> Optional[int]:
    """Return ClickFunnels contact id; create only if not found."""
    if not is_configured():
        return None
    existing = await find_contact_by_email(email)
    if existing and existing.get("id"):
        return existing["id"]
    created = await create_contact(email, full_name)
    return created.get("id") if created else None


# ---------- Tags ----------
async def find_tag_by_name(name: str) -> Optional[int]:
    if name in _TAG_ID_CACHE:
        return _TAG_ID_CACHE[name]
    status, data = await _request("GET", f"/workspaces/{CLICKFUNNELS_WORKSPACE_ID}/contacts/tags", params={"filter[name]": name})
    if status == 200 and isinstance(data, list) and data and data[0].get("id"):
        tid = data[0]["id"]
        _TAG_ID_CACHE[name] = tid
        return tid
    return None


async def create_tag(name: str) -> Optional[int]:
    status, data = await _request("POST", f"/workspaces/{CLICKFUNNELS_WORKSPACE_ID}/contacts/tags", json_body={"contacts_tag": {"name": name}})
    if status in (200, 201) and isinstance(data, dict) and data.get("id"):
        tid = data["id"]
        _TAG_ID_CACHE[name] = tid
        return tid
    # If creation failed because tag already exists, try lookup again.
    return await find_tag_by_name(name)


async def find_or_create_tag(name: str) -> Optional[int]:
    return (await find_tag_by_name(name)) or (await create_tag(name))


async def apply_tag(contact_id: int, tag_name: str) -> bool:
    if not is_configured():
        return False
    tag_id = await find_or_create_tag(tag_name)
    if not tag_id:
        logger.warning("ClickFunnels: could not resolve tag id for %r", tag_name)
        return False
    status, data = await _request("POST", f"/contacts/{contact_id}/applied_tags", json_body={"contacts_applied_tag": {"tag_id": tag_id}})
    if status in (200, 201):
        return True
    # Re-applying an existing tag may return 4xx duplicate — treat as success.
    if status == 422:
        return True
    logger.warning("ClickFunnels apply_tag(%s, %s) failed (%s): %s", contact_id, tag_name, status, data)
    return False


# ---------- High-level sync coroutines (background-task friendly) ----------
async def _safe_run(coro, *, label: str):
    """Wrap a coroutine so failures never propagate out of background tasks."""
    try:
        await coro
    except Exception as e:
        logger.error("ClickFunnels %s failed: %s", label, e, exc_info=True)


async def _sync_email_with_tags(email: str, full_name: Optional[str], tags: List[str]) -> None:
    if not is_configured():
        logger.debug("ClickFunnels not configured; skipping sync for %s", email)
        return
    cid = await upsert_contact(email, full_name)
    if not cid:
        logger.warning("ClickFunnels: upsert_contact returned no id for %s; skipping tags", email)
        return
    for tag in tags:
        if tag:
            await apply_tag(cid, tag)


async def sync_signup(email: str, full_name: Optional[str] = None) -> None:
    """Background-task entry point: contact upsert + signup tag."""
    await _safe_run(_sync_email_with_tags(email, full_name, [TAG_SIGNUP]), label=f"sync_signup<{email}>")


async def sync_purchase(email: str, full_name: Optional[str], package: str) -> None:
    pkg = (package or "").lower()
    if pkg == "lifetime":
        tag = TAG_PURCHASE_LIFETIME
    elif pkg == "monthly":
        tag = TAG_PURCHASE_MONTHLY
    else:
        tag = f"iif_purchased_{pkg}" if pkg else None
    tags = [t for t in [TAG_SIGNUP, tag] if t]
    await _safe_run(_sync_email_with_tags(email, full_name, tags), label=f"sync_purchase<{email},{pkg}>")


async def sync_refund(email: str, full_name: Optional[str] = None) -> None:
    await _safe_run(_sync_email_with_tags(email, full_name, [TAG_REFUNDED]), label=f"sync_refund<{email}>")


# ---------- Webhook signature verification ----------
class SignatureError(Exception):
    pass


def _parse_signature_header(value: str) -> Dict[str, str]:
    """Parse 't=...,v1=...,v2=...' style signature header into a dict."""
    parts: Dict[str, str] = {}
    if not value:
        return parts
    for piece in value.split(","):
        if "=" in piece:
            k, v = piece.split("=", 1)
            parts[k.strip()] = v.strip()
    return parts


def verify_signature(body: bytes, headers: Dict[str, str]) -> Dict[str, str]:
    """Verify CF webhook signature. Returns parsed signature parts.

    ClickFunnels sends a `Signature` header in the form `t=<unix>,v1=<hex>` where v1
    is `HMAC-SHA256(secret, "{t}.{body}").hexdigest()`. Reject if older than
    WEBHOOK_TOLERANCE_SECONDS or signature mismatches. Empty secret => skip
    verification (DEV ONLY).
    """
    if not CLICKFUNNELS_WEBHOOK_SECRET:
        logger.warning("CLICKFUNNELS_WEBHOOK_SECRET unset — accepting unsigned webhook (DEV ONLY).")
        return {}

    # Normalize headers to lowercase keys for tolerance
    h_lower = {k.lower(): v for k, v in headers.items()}
    sig_header = h_lower.get("signature") or h_lower.get("x-cf-signature") or h_lower.get("x-clickfunnels-signature") or ""
    parsed = _parse_signature_header(sig_header)
    timestamp = parsed.get("t") or h_lower.get("x-cf-timestamp") or h_lower.get("x-clickfunnels-timestamp")
    provided_sig = parsed.get("v1") or parsed.get("v2") or h_lower.get("x-cf-signature-v1")

    if not timestamp or not provided_sig:
        raise SignatureError("Missing signature or timestamp header.")

    try:
        ts_int = int(timestamp)
    except ValueError:
        raise SignatureError("Invalid timestamp value.")

    now = int(time.time())
    if abs(now - ts_int) > WEBHOOK_TOLERANCE_SECONDS:
        raise SignatureError("Signature has expired.")

    signed_payload = f"{timestamp}.".encode("utf-8") + body
    expected = hmac.new(CLICKFUNNELS_WEBHOOK_SECRET.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, provided_sig):
        raise SignatureError("Signature mismatch.")
    return parsed


# ---------- Event parsing ----------
def _deep_get(d: Any, *keys: str, default: Any = None) -> Any:
    cur = d
    for k in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(k)
        if cur is None:
            return default
    return cur


def parse_event(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a ClickFunnels webhook payload into a simple dict.

    Returns:
        {
          "event_id": str,
          "event_type": str,
          "email": str | None,
          "full_name": str | None,
          "contact_id": int | None,
          "amount_cents": int | None,
          "currency": str | None,
          "is_purchase": bool,
        }

    ClickFunnels webhook payloads use a variety of shapes depending on event type.
    We probe several common locations so that the same handler works for order/
    payment events without being brittle to schema changes.
    """
    event_id = payload.get("id") or payload.get("event_id") or payload.get("uuid") or ""
    event_type = payload.get("event") or payload.get("type") or payload.get("event_type") or ""

    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload

    # Common locations for email
    email = (
        _deep_get(data, "contact", "email_address")
        or _deep_get(data, "contact", "email")
        or _deep_get(data, "customer", "email")
        or _deep_get(data, "attributes", "customer_email")
        or _deep_get(data, "attributes", "email")
        or data.get("email_address")
        or data.get("email")
    )

    first = _deep_get(data, "contact", "first_name") or _deep_get(data, "customer", "first_name")
    last = _deep_get(data, "contact", "last_name") or _deep_get(data, "customer", "last_name")
    full_name = " ".join([p for p in [first, last] if p]) or _deep_get(data, "customer", "name") or None

    contact_id_raw = _deep_get(data, "contact", "id") or data.get("contact_id")
    try:
        contact_id = int(contact_id_raw) if contact_id_raw is not None else None
    except (TypeError, ValueError):
        contact_id = None

    # Order/payment amount
    amount = (
        data.get("total_amount")
        or data.get("amount")
        or _deep_get(data, "order", "total_amount")
        or _deep_get(data, "attributes", "total_amount")
    )
    amount_cents: Optional[int] = None
    if amount is not None:
        try:
            amount_cents = int(round(float(amount) * 100)) if "." in str(amount) else int(amount)
        except (TypeError, ValueError):
            amount_cents = None

    currency = data.get("currency") or _deep_get(data, "order", "currency") or "usd"
    is_purchase = bool(event_type) and any(k in event_type.lower() for k in ("paid", "purchase", "order.created", "payment.success", "order_paid"))

    return {
        "event_id": str(event_id),
        "event_type": str(event_type),
        "email": email,
        "full_name": full_name,
        "contact_id": contact_id,
        "amount_cents": amount_cents,
        "currency": currency,
        "is_purchase": is_purchase,
        "raw": payload,
    }


def package_from_amount(amount_cents: Optional[int]) -> str:
    """Best-effort: map amount to our internal package name."""
    if amount_cents is None:
        return "lifetime"  # safest default — Pro lifetime
    if amount_cents <= 2500:
        return "monthly"
    return "lifetime"
