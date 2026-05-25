"""Plan quota logic.

Tier base allowances:
  - free:         1 plan
  - pro_monthly:  1 plan + $10/mo per additional slot (recurring)
  - pro_lifetime: 6 plans + $19.99 one-time per additional slot (permanent)

Credit storage: `auth.users.user_metadata` (Supabase JSONB column, no schema
migration needed). Specifically:
  - `plan_credits` (int, default 0)  — total extra slots earned
  - `extra_sub_ids` (list[str])      — Stripe subscription IDs for monthly extras
      (used by webhook handler to decrement credits on cancel)

Plan counting: COUNT(plans WHERE user_id = X). Plans are HARD-deleted on user
request, so this count automatically reflects active plans.
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional

from fastapi import HTTPException

from auth_supabase import admin

logger = logging.getLogger(__name__)

BASE_ALLOWANCE: Dict[str, int] = {
    "free": 1,
    "pro_monthly": 1,
    "pro_lifetime": 6,
}


def _normalize_tier(subscription_status: Optional[str]) -> str:
    if subscription_status in ("pro_lifetime", "pro_monthly"):
        return subscription_status
    return "free"


def _user_metadata(user_id: str) -> Dict:
    """Fetch raw user_metadata for the given user (or {} on failure)."""
    try:
        res = admin.auth.admin.get_user_by_id(user_id)
        user = getattr(res, "user", None) or (res.get("user") if isinstance(res, dict) else None)
        if not user:
            return {}
        meta = getattr(user, "user_metadata", None)
        if meta is None and isinstance(user, dict):
            meta = user.get("user_metadata")
        return dict(meta or {})
    except Exception as e:
        logger.warning("get_user_by_id failed for %s: %s", user_id, e)
        return {}


def _update_user_metadata(user_id: str, patch: Dict) -> bool:
    """Merge `patch` into user_metadata (server-side merge by reading current, then writing)."""
    try:
        current = _user_metadata(user_id)
        merged = {**current, **patch}
        admin.auth.admin.update_user_by_id(user_id, {"user_metadata": merged})
        return True
    except Exception as e:
        logger.error("update_user_by_id failed for %s: %s", user_id, e)
        return False


def get_plan_credits(user_id: str) -> int:
    meta = _user_metadata(user_id)
    val = meta.get("plan_credits", 0)
    try:
        return max(0, int(val))
    except (TypeError, ValueError):
        return 0


def get_extra_sub_ids(user_id: str) -> List[str]:
    meta = _user_metadata(user_id)
    val = meta.get("extra_sub_ids", [])
    return list(val) if isinstance(val, list) else []


def add_plan_credits(user_id: str, delta: int, *, sub_id: Optional[str] = None) -> int:
    """Increment plan_credits by `delta` (can be negative). Optionally track a
    Stripe subscription id (for monthly recurring extras). Returns new total.
    """
    meta = _user_metadata(user_id)
    cur = int(meta.get("plan_credits", 0) or 0)
    new_total = max(0, cur + delta)
    patch: Dict = {"plan_credits": new_total}
    if sub_id:
        ids = list(meta.get("extra_sub_ids") or [])
        if delta > 0 and sub_id not in ids:
            ids.append(sub_id)
        elif delta < 0 and sub_id in ids:
            ids.remove(sub_id)
        patch["extra_sub_ids"] = ids
    _update_user_metadata(user_id, patch)
    logger.info("Plan credits for %s: %s -> %s (delta=%s, sub=%s)", user_id, cur, new_total, delta, sub_id)
    return new_total


def remove_extra_subscription(user_id: str, sub_id: str) -> int:
    """Called when an extra-plan Monthly subscription is canceled. Decrement
    credits by 1 if this sub_id is in the user's extra_sub_ids list.
    Returns new total (or current total if no-op).
    """
    meta = _user_metadata(user_id)
    ids = list(meta.get("extra_sub_ids") or [])
    if sub_id not in ids:
        return int(meta.get("plan_credits", 0) or 0)
    ids.remove(sub_id)
    cur = int(meta.get("plan_credits", 0) or 0)
    new_total = max(0, cur - 1)
    _update_user_metadata(user_id, {"plan_credits": new_total, "extra_sub_ids": ids})
    logger.info("Removed extra sub %s for %s: credits %s -> %s", sub_id, user_id, cur, new_total)
    return new_total


def count_active_plans(user_id: str) -> int:
    """Hard-delete model: COUNT(plans WHERE user_id = X)."""
    try:
        res = admin.table("plans").select("id", count="exact").eq("user_id", user_id).execute()
        return int(res.count or 0)
    except Exception as e:
        logger.error("count_active_plans failed for %s: %s", user_id, e)
        return 0


def get_quota(user_id: str, subscription_status: Optional[str]) -> Dict:
    """Compute the user's plan quota state."""
    tier = _normalize_tier(subscription_status)
    base = BASE_ALLOWANCE[tier]
    credits = get_plan_credits(user_id)
    used = count_active_plans(user_id)
    limit = base + credits
    remaining = max(0, limit - used)
    return {
        "tier": tier,
        "base_allowance": base,
        "credits": credits,
        "limit": limit,
        "used": used,
        "remaining": remaining,
        "extra_price_cents": 1999 if tier == "pro_lifetime" else (1000 if tier == "pro_monthly" else None),
        "extra_package": "extra_lifetime" if tier == "pro_lifetime" else ("extra_monthly" if tier == "pro_monthly" else None),
    }


def assert_can_create_plan(user_id: str, subscription_status: Optional[str]) -> Dict:
    q = get_quota(user_id, subscription_status)
    if q["remaining"] <= 0:
        detail = {
            "code": "plan_quota_exceeded",
            "tier": q["tier"],
            "limit": q["limit"],
            "used": q["used"],
            "message": _quota_message(q),
            "extra_package": q["extra_package"],
            "extra_price_cents": q["extra_price_cents"],
        }
        raise HTTPException(status_code=402, detail=detail)
    return q


def _quota_message(q: Dict) -> str:
    tier = q["tier"]
    limit = q["limit"]
    if tier == "free":
        return f"Your Free plan includes {limit} plan. Upgrade to Pro for more."
    if tier == "pro_monthly":
        return f"You're using {q['used']} of {limit} plan slots. Buy an additional plan slot for $10/mo to add another."
    return f"You're using {q['used']} of {limit} plan slots. Buy an additional plan slot for $19.99 (one-time) to add another."
