from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from auth_supabase import require_user, anon_client_with_token, admin, CurrentUser
from services import quota as quota_svc

router = APIRouter(prefix="/plans", tags=["plans"])


class CreatePlanIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    idea: Optional[str] = None
    founder_backstory: Optional[str] = None
    industry: Optional[str] = None
    stage: Optional[str] = None


@router.get("")
async def list_plans(user: CurrentUser = Depends(require_user)):
    cli = anon_client_with_token(user.token)
    res = cli.table("plans").select("*").order("updated_at", desc=True).execute()
    return {"plans": res.data or []}


@router.get("/quota")
async def get_plan_quota(user: CurrentUser = Depends(require_user)):
    """Return the user's current plan quota state (tier, limit, used, remaining, extras info)."""
    profile_res = admin.table("profiles").select("subscription_status").eq("id", user.id).limit(1).execute()
    status = profile_res.data[0].get("subscription_status") if profile_res.data else None
    return quota_svc.get_quota(user.id, status)


@router.post("", status_code=201)
async def create_plan(body: CreatePlanIn, user: CurrentUser = Depends(require_user)):
    # Quota enforcement (Free=1, pro_monthly=1+credits, pro_lifetime=6+credits)
    profile_res = admin.table("profiles").select("subscription_status").eq("id", user.id).limit(1).execute()
    status = profile_res.data[0].get("subscription_status") if profile_res.data else None
    quota_svc.assert_can_create_plan(user.id, status)

    cli = anon_client_with_token(user.token)
    payload = body.dict()
    payload["user_id"] = user.id
    payload["current_step"] = 1
    res = cli.table("plans").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Could not create plan")
    plan = res.data[0]
    rows = [{"plan_id": plan["id"], "step_num": n, "status": "not_started"} for n in range(1, 8)]
    admin.table("plan_steps").insert(rows).execute()
    return plan


@router.delete("/{plan_id}")
async def delete_plan(plan_id: str, user: CurrentUser = Depends(require_user)):
    """Permanently delete a plan and all dependent rows. Quota slot is freed."""
    # Verify ownership via anon client (RLS enforces user_id = auth.uid())
    cli = anon_client_with_token(user.token)
    own = cli.table("plans").select("id,user_id").eq("id", plan_id).limit(1).execute()
    if not own.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    if own.data[0].get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="Not your plan")

    # Hard-delete dependent rows first (service role bypasses RLS).
    # If FK ON DELETE CASCADE is defined this is redundant but harmless.
    for table in ("plan_inputs", "plan_steps", "ai_runs"):
        try:
            admin.table(table).delete().eq("plan_id", plan_id).execute()
        except Exception:
            # Some installations may not have ai_runs; ignore.
            pass
    admin.table("plans").delete().eq("id", plan_id).execute()
    return {"ok": True, "deleted_plan_id": plan_id}


@router.get("/{plan_id}")
async def get_plan(plan_id: str, user: CurrentUser = Depends(require_user)):
    cli = anon_client_with_token(user.token)
    res = cli.table("plans").select("*").eq("id", plan_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan = res.data[0]
    steps = cli.table("plan_steps").select("*").eq("plan_id", plan_id).order("step_num").execute()
    inputs = cli.table("plan_inputs").select("*").eq("plan_id", plan_id).execute()
    return {"plan": plan, "steps": steps.data or [], "inputs": inputs.data or []}


class UpdatePlanIn(BaseModel):
    title: Optional[str] = None
    current_step: Optional[int] = None


@router.patch("/{plan_id}")
async def update_plan(plan_id: str, body: UpdatePlanIn, user: CurrentUser = Depends(require_user)):
    cli = anon_client_with_token(user.token)
    payload = {k: v for k, v in body.dict().items() if v is not None}
    if not payload:
        return {"ok": True}
    res = cli.table("plans").update(payload).eq("id", plan_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    return res.data[0]


class UpsertInputIn(BaseModel):
    step_num: int = Field(ge=1, le=7)
    field_key: str
    value: Optional[str] = None
    meta: Optional[dict] = None


@router.post("/{plan_id}/inputs")
async def upsert_input(plan_id: str, body: UpsertInputIn, user: CurrentUser = Depends(require_user)):
    cli = anon_client_with_token(user.token)
    # Verify ownership
    own = cli.table("plans").select("id").eq("id", plan_id).limit(1).execute()
    if not own.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    payload = {"plan_id": plan_id, "step_num": body.step_num, "field_key": body.field_key, "value": body.value, "meta": body.meta or {}}
    res = cli.table("plan_inputs").upsert(payload, on_conflict="plan_id,step_num,field_key").execute()
    return res.data[0] if res.data else payload


class StepStatusIn(BaseModel):
    step_num: int = Field(ge=1, le=7)
    status: str
    data: Optional[dict] = None


@router.post("/{plan_id}/step-status")
async def update_step_status(plan_id: str, body: StepStatusIn, user: CurrentUser = Depends(require_user)):
    cli = anon_client_with_token(user.token)
    own = cli.table("plans").select("id,title").eq("id", plan_id).limit(1).execute()
    if not own.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    payload = {"plan_id": plan_id, "step_num": body.step_num, "status": body.status, "data": body.data or {}}
    res = cli.table("plan_steps").upsert(payload, on_conflict="plan_id,step_num").execute()

    # Fire plan-ready email when Step 7 flips to complete for the first time
    if body.step_num == 7 and (body.status or "").lower() in ("complete", "completed"):
        try:
            import os
            import asyncio
            from services import email_service as em
            plan_title = own.data[0].get("title") or "Your Plan"
            app_url = os.environ.get("APP_PUBLIC_URL", "https://influenceincubator.xyz").rstrip("/")
            business_plan_url = f"{app_url}/plans/{plan_id}/business-plan"
            prof = cli.table("profiles").select("email,full_name").eq("id", user.id).limit(1).execute().data
            if prof:
                asyncio.create_task(em.send_plan_ready(prof[0].get("email") or user.email, prof[0].get("full_name"), plan_title, business_plan_url))
        except Exception as _e:
            pass  # never block the response for email issues

    return res.data[0] if res.data else payload
