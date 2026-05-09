from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from auth_supabase import require_user, anon_client_with_token, admin, CurrentUser
from access import has_pro_access

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


@router.post("", status_code=201)
async def create_plan(body: CreatePlanIn, user: CurrentUser = Depends(require_user)):
    cli = anon_client_with_token(user.token)
    # Free-tier 1-plan limit
    profile_res = cli.table("profiles").select("*").eq("id", user.id).limit(1).execute()
    profile = profile_res.data[0] if profile_res.data else None
    if not has_pro_access(profile):
        existing = cli.table("plans").select("id").execute()
        if existing.data and len(existing.data) >= 1:
            raise HTTPException(status_code=402, detail={"code": "plan_limit_reached", "message": "Free plan limit reached. Upgrade to Pro for unlimited plans."})
    payload = body.dict()
    payload["user_id"] = user.id
    payload["current_step"] = 1
    res = cli.table("plans").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Could not create plan")
    plan = res.data[0]
    # Initialize 7 plan_steps records (use service role to bypass RLS for bulk init)
    rows = [{"plan_id": plan["id"], "step_num": n, "status": "not_started"} for n in range(1, 8)]
    admin.table("plan_steps").insert(rows).execute()
    return plan


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
    own = cli.table("plans").select("id").eq("id", plan_id).limit(1).execute()
    if not own.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    payload = {"plan_id": plan_id, "step_num": body.step_num, "status": body.status, "data": body.data or {}}
    res = cli.table("plan_steps").upsert(payload, on_conflict="plan_id,step_num").execute()
    return res.data[0] if res.data else payload
