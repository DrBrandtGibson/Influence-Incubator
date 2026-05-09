"""Supabase clients & JWT auth helpers."""
import os
import logging
from typing import Optional
from fastapi import Header, HTTPException, status
from supabase import create_client, Client
import httpx

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_PUBLISHABLE_KEY = os.environ["SUPABASE_PUBLISHABLE_KEY"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# Service-role client (server-side only; bypasses RLS).
admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def anon_client_with_token(access_token: str) -> Client:
    """Return an anon client whose PostgREST + Auth requests are scoped to the user.
    With this, RLS policies will see auth.uid() = the user's id.
    """
    cli = create_client(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    cli.postgrest.auth(access_token)
    return cli


async def verify_token_via_supabase(access_token: str) -> dict:
    """Validate the JWT by asking Supabase /auth/v1/user. This avoids needing the JWT secret
    and works with both legacy (HS256) and new (ES256) Supabase keys.
    Returns the user dict on success, raises HTTPException 401 on failure.
    """
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": SUPABASE_PUBLISHABLE_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, headers=headers)
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return r.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Token verification failure: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")


class CurrentUser:
    def __init__(self, user: dict, token: str):
        self.id: str = user["id"]
        self.email: Optional[str] = user.get("email")
        self.token: str = token
        self.raw: dict = user


async def require_user(authorization: Optional[str] = Header(None)) -> CurrentUser:
    """FastAPI dependency. Extracts Bearer token, verifies via Supabase, returns CurrentUser."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    user = await verify_token_via_supabase(token)
    return CurrentUser(user=user, token=token)


async def optional_user(authorization: Optional[str] = Header(None)) -> Optional[CurrentUser]:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1].strip()
        user = await verify_token_via_supabase(token)
        return CurrentUser(user=user, token=token)
    except HTTPException:
        return None
