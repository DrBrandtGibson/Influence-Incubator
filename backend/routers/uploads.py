"""Server-side file uploads via Supabase Storage using the service-role key.
Bypasses storage RLS so users don't need to run additional SQL policies.
"""
import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from auth_supabase import require_user, anon_client_with_token, admin, CurrentUser

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/svg+xml"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB
LOGO_BUCKET = "iif-logos"


@router.post("/logo")
async def upload_logo(plan_id: str, file: UploadFile = File(...), user: CurrentUser = Depends(require_user)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}. Allowed: PNG, JPG, WEBP, GIF, SVG.")
    contents = await file.read()
    if len(contents) > MAX_BYTES:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_BYTES // (1024 * 1024)} MB.")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    # Verify the user owns the plan (RLS-style check via user-scoped client)
    try:
        cli = anon_client_with_token(user.token)
        own = cli.table("plans").select("id").eq("id", plan_id).limit(1).execute()
        if not own.data:
            raise HTTPException(status_code=404, detail="Plan not found.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan ownership check failed: {e}")

    # Build a safe object path
    safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in (file.filename or "logo"))
    object_path = f"{plan_id}/{uuid.uuid4().hex[:8]}_{safe_name}"

    # Upload via service role
    try:
        admin.storage.from_(LOGO_BUCKET).upload(
            path=object_path,
            file=contents,
            file_options={"content-type": file.content_type, "cache-control": "3600", "upsert": "false"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    public_url = admin.storage.from_(LOGO_BUCKET).get_public_url(object_path)
    # Persist as plan_input for convenience
    try:
        admin.table("plan_inputs").upsert(
            {"plan_id": plan_id, "step_num": 1, "field_key": "logo_url", "value": public_url},
            on_conflict="plan_id,step_num,field_key",
        ).execute()
    except Exception:
        pass

    return {"url": public_url, "path": object_path}
