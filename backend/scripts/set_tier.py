"""Set the subscription tier for an already-known user_id."""
import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
from supabase import create_client

admin = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def set_tier(user_id: str, email: str, tier: str) -> None:
    now = datetime.now(timezone.utc).isoformat()

    # Try to update; if no row, insert.
    upd = admin.table("profiles").update({
        "subscription_status": tier,
        "email": email,
        "pro_until": None,
        "purchased_at": now,
        "updated_at": now,
    }).eq("id", user_id).execute()

    if not upd.data:
        print("[INFO] Profile row missing, inserting…")
        admin.table("profiles").insert({
            "id": user_id,
            "email": email,
            "subscription_status": tier,
            "purchased_at": now,
        }).execute()

    check = admin.table("profiles").select("id,email,subscription_status,pro_until,purchased_at").eq("id", user_id).limit(1).execute()
    print("[VERIFY]", check.data)


if __name__ == "__main__":
    set_tier(sys.argv[1], sys.argv[2], sys.argv[3])
