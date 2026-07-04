"""Create a Supabase auth user and set their subscription tier.

Usage:
    python scripts/add_user.py <email> <password> <tier>

Tiers: free | pro_monthly | pro_lifetime | pro_lifetime_unlimited
"""
import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load .env from backend root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def add_user(email: str, password: str, tier: str) -> None:
    email = email.strip()
    valid_tiers = {"free", "pro_monthly", "pro_lifetime", "pro_lifetime_unlimited"}
    if tier not in valid_tiers:
        raise SystemExit(f"Invalid tier '{tier}'. Must be one of: {valid_tiers}")

    # 1. Try to create the user (email_confirm=True so they can log in immediately)
    user_id = None
    try:
        resp = admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
        })
        if resp and resp.user:
            user_id = resp.user.id
            print(f"[OK] Created auth user: {email} (id={user_id})")
    except Exception as e:
        msg = str(e)
        print(f"[INFO] create_user failed or user exists: {msg}")

    # 2. If user already exists, look them up
    if not user_id:
        # Paginate through users to find by email (list_users returns limited pages)
        page = 1
        while True:
            resp = admin.auth.admin.list_users(page=page, per_page=200)
            users = resp if isinstance(resp, list) else getattr(resp, "users", []) or resp
            if not users:
                break
            for u in users:
                u_email = getattr(u, "email", None) or (u.get("email") if isinstance(u, dict) else None)
                if u_email and u_email.lower() == email.lower():
                    user_id = getattr(u, "id", None) or u.get("id")
                    break
            if user_id or len(users) < 200:
                break
            page += 1

        if not user_id:
            raise SystemExit(f"Could not find or create user {email}")
        print(f"[OK] Found existing auth user: {email} (id={user_id})")

        # Update password to the requested one (idempotent reset)
        try:
            admin.auth.admin.update_user_by_id(user_id, {"password": password, "email_confirm": True})
            print("[OK] Password updated for existing user")
        except Exception as e:
            print(f"[WARN] Could not update password: {e}")

    # 3. Ensure profile row exists (trigger should have made one, but be defensive)
    prof = admin.table("profiles").select("id").eq("id", user_id).limit(1).execute()
    if not prof.data:
        admin.table("profiles").insert({
            "id": user_id,
            "email": email,
            "subscription_status": tier,
            "purchased_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        print(f"[OK] Inserted profile row with tier={tier}")
    else:
        update = {
            "subscription_status": tier,
            "email": email,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        # Lifetime tiers have no expiry
        if tier in ("pro_lifetime", "pro_lifetime_unlimited"):
            update["pro_until"] = None
            update["purchased_at"] = datetime.now(timezone.utc).isoformat()
        admin.table("profiles").update(update).eq("id", user_id).execute()
        print(f"[OK] Updated profile row to tier={tier}")

    # 4. Verify
    check = admin.table("profiles").select("id,email,subscription_status,pro_until,purchased_at").eq("id", user_id).limit(1).execute()
    print(f"[VERIFY] {check.data}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python scripts/add_user.py <email> <password> <tier>")
        sys.exit(1)
    add_user(sys.argv[1], sys.argv[2], sys.argv[3])
