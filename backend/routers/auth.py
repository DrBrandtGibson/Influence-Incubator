"""Auth helpers — wraps Supabase admin to handle signup with auto-confirm,
so users can immediately sign in without an email-verification round-trip
(which doesn't work in iframe preview environments).
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr
from auth_supabase import admin
from services import clickfunnels as cf

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupIn(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


@router.post("/signup")
async def signup(body: SignupIn, background_tasks: BackgroundTasks):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    try:
        res = admin.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
            "user_metadata": {"full_name": body.full_name or body.email.split("@")[0]},
        })
        user = getattr(res, "user", None) or (res.get("user") if isinstance(res, dict) else None)
        if not user:
            raise HTTPException(status_code=500, detail="Could not create user")
        uid = getattr(user, "id", None) or user.get("id")
        email = getattr(user, "email", None) or user.get("email")
        # Fire-and-forget: push contact + signup tag to ClickFunnels
        background_tasks.add_task(cf.sync_signup, email, body.full_name)
        return {"id": uid, "email": email}
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if any(k in msg.lower() for k in ("already", "registered", "duplicate", "exists")):
            raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in.")
        raise HTTPException(status_code=400, detail=msg or "Signup failed")
