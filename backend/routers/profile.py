from fastapi import APIRouter, Depends, HTTPException
from auth_supabase import require_user, admin, anon_client_with_token, CurrentUser

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me")
async def me(user: CurrentUser = Depends(require_user)):
    """Return the user's profile row, creating one if needed (in case the auth.users trigger missed it)."""
    cli = anon_client_with_token(user.token)
    res = cli.table("profiles").select("*").eq("id", user.id).limit(1).execute()
    if not res.data:
        # Fallback: create row via service role (bypass RLS) using admin client
        admin.table("profiles").upsert({"id": user.id, "email": user.email, "full_name": (user.email or "").split("@")[0]}).execute()
        res = cli.table("profiles").select("*").eq("id", user.id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Could not load profile")
    return res.data[0]
