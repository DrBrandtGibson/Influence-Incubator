"""Pricing/access helpers."""
from datetime import datetime, timezone


def has_pro_access(profile: dict) -> bool:
    if not profile:
        return False
    status = profile.get("subscription_status")
    if status in ("pro_lifetime", "pro_lifetime_unlimited"):
        return True
    if status == "pro_monthly":
        pu = profile.get("pro_until")
        if not pu:
            return False
        try:
            if isinstance(pu, str):
                # Supabase returns ISO string
                pu_dt = datetime.fromisoformat(pu.replace("Z", "+00:00"))
            else:
                pu_dt = pu
            return pu_dt > datetime.now(timezone.utc)
        except Exception:
            return False
    return False


def can_access_step(profile: dict, step_num: int) -> bool:
    if step_num in (1, 2):
        return True
    return has_pro_access(profile)
