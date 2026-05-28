"""AI endpoints — Claude Sonnet 4.5 via Emergent universal LLM key, streaming via SSE.
Provides three modes per spec: answer-question, expand-answer, refine.
All calls send the full plan context to keep answers coherent.
"""
import os
import json
import asyncio
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from auth_supabase import require_user, anon_client_with_token, admin, CurrentUser
from access import can_access_step

from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger("iif.ai")
router = APIRouter(prefix="/ai", tags=["ai"])

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
MODEL = ("anthropic", "claude-sonnet-4-5-20250929")

SYSTEM_BASE = (
    "You are an expert business plan writer and strategic ghostwriter for solo entrepreneurs, "
    "coaches and aspiring influencers. You are the AI engine inside The Influence Incubator Formula, "
    "a 7-step business planning app by Dr. Brandt R. Gibson. Your tone is calm, deliberate, premium, "
    "editorial, and deeply human — never hype, never markdown decoration spam. "
    "Always preserve the user's voice. Be concrete, vivid, and specific."
)


class AIRunIn(BaseModel):
    plan_id: Optional[str] = None
    step_num: int
    field_key: str
    field_label: str  # the question being answered
    user_text: Optional[str] = ""  # current draft from user
    instructions: Optional[str] = ""  # for refine mode
    sub_module: Optional[str] = ""  # e.g. "MTP Discovery"
    extra_context: Optional[Dict[str, Any]] = None  # ad-hoc structured context


async def _build_plan_context(user: CurrentUser, plan_id: Optional[str]) -> str:
    if not plan_id:
        return ""
    try:
        cli = anon_client_with_token(user.token)
        plan = cli.table("plans").select("*").eq("id", plan_id).limit(1).execute()
        if not plan.data:
            return ""
        p = plan.data[0]
        inputs = cli.table("plan_inputs").select("*").eq("plan_id", plan_id).order("step_num").execute()
        ctx_lines = [
            f"Plan title: {p.get('title')}",
            f"Original idea: {p.get('idea') or '—'}",
            f"Founder backstory: {p.get('founder_backstory') or '—'}",
            f"Industry: {p.get('industry') or '—'}",
            f"Stage: {p.get('stage') or '—'}",
            "",
            "Existing answers (most recent):"
        ]
        for row in inputs.data or []:
            v = (row.get("value") or "").strip()
            if not v:
                continue
            ctx_lines.append(f"- [Step {row['step_num']} · {row['field_key']}] {v[:600]}")
        return "\n".join(ctx_lines)
    except Exception as e:
        logger.warning(f"plan-context build failed: {e}")
        return ""


def _system_for(mode: str) -> str:
    if mode == "answer":
        return SYSTEM_BASE + (
            "\n\nMODE: ANSWER. Read the question carefully and the user's plan context. "
            "Generate a thoughtful, specific draft answer in the user's voice. Do NOT add headings unless asked. "
            "Keep it concrete and emotionally resonant. Length: 3–6 sentences unless the question explicitly invites more."
        )
    if mode == "expand":
        return SYSTEM_BASE + (
            "\n\nMODE: EXPAND. The user has written a draft answer. Expand and enrich it while strictly preserving "
            "their voice, vocabulary, and intent. Add depth, examples, sensory detail, and clarity. Do NOT replace "
            "their content; build on it. Return the rewritten answer only — no preamble."
        )
    if mode == "refine":
        return SYSTEM_BASE + (
            "\n\nMODE: REFINE. Apply the user's refinement instruction (e.g. shorter, more specific, more emotional, "
            "more professional) to their draft. Return only the rewritten answer."
        )
    if mode == "generate":
        return SYSTEM_BASE + (
            "\n\nMODE: GENERATE. Produce a structured creative output as requested. Use the user's plan context "
            "to keep ideas tightly relevant. Return clean, copy-pastable content."
        )
    if mode == "synthesize":
        return SYSTEM_BASE + (
            "\n\nMODE: SYNTHESIZE. Read the provided reflections and produce the requested distilled artifact "
            "(MTP statement, Brand Voice, Mission line, etc). Be concise and decisive. Return ONLY the artifact "
            "unless asked for explanation."
        )
    return SYSTEM_BASE


def _user_prompt(mode: str, body: AIRunIn, plan_context: str) -> str:
    parts = []
    if plan_context:
        parts.append("=== PLAN CONTEXT ===\n" + plan_context)
    if body.sub_module:
        parts.append(f"=== SUB-MODULE ===\n{body.sub_module}")
    if body.extra_context:
        parts.append("=== EXTRA CONTEXT ===\n" + json.dumps(body.extra_context, indent=2))
    parts.append(f"=== QUESTION (Step {body.step_num}, field={body.field_key}) ===\n{body.field_label}")
    if mode == "answer":
        if body.user_text:
            parts.append(f"=== USER'S CURRENT DRAFT (use as starting point) ===\n{body.user_text}")
        parts.append("=== TASK ===\nWrite the answer to the question above.")
    elif mode == "expand":
        parts.append(f"=== USER DRAFT ===\n{body.user_text or ''}")
        parts.append("=== TASK ===\nReturn an expanded, richer version of the user's draft.")
    elif mode == "refine":
        parts.append(f"=== USER DRAFT ===\n{body.user_text or ''}")
        parts.append(f"=== INSTRUCTION ===\n{body.instructions or 'shorten and tighten while keeping the voice intact'}")
        parts.append("=== TASK ===\nReturn only the rewritten answer.")
    elif mode == "generate":
        parts.append(f"=== INSTRUCTION ===\n{body.instructions or body.field_label}")
        parts.append("=== TASK ===\nProduce the requested content.")
    elif mode == "synthesize":
        parts.append(f"=== INSTRUCTION ===\n{body.instructions or body.field_label}")
        parts.append("=== TASK ===\nReturn only the synthesized artifact.")
    return "\n\n".join(parts)


async def _ensure_step_access(user: CurrentUser, step_num: int):
    cli = anon_client_with_token(user.token)
    p = cli.table("profiles").select("*").eq("id", user.id).limit(1).execute()
    profile = p.data[0] if p.data else None
    if not can_access_step(profile, step_num):
        raise HTTPException(status_code=403, detail={"code": "step_locked", "message": f"Step {step_num} requires Pro access."})


async def _stream_claude(mode: str, body: AIRunIn, user: CurrentUser):
    """Yields SSE events. We chunk the full Claude response to simulate streaming UX since
    emergentintegrations.LlmChat returns the full message at once. Output rate is generous."""
    plan_context = await _build_plan_context(user, body.plan_id)
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"user-{user.id}-step{body.step_num}-{body.field_key}-{mode}",
        system_message=_system_for(mode),
    ).with_model(*MODEL)
    prompt = _user_prompt(mode, body, plan_context)
    msg = UserMessage(text=prompt)

    yield f"event: start\ndata: {json.dumps({'mode': mode, 'field_key': body.field_key})}\n\n"

    try:
        text = await chat.send_message(msg)
    except Exception as e:
        logger.exception("Claude error")
        err = {"error": str(e) or "Generation failed."}
        yield f"event: error\ndata: {json.dumps(err)}\n\n"
        return

    # Persist ai_run via service role (bypass RLS to ensure logging even if RLS hiccups)
    try:
        admin.table("ai_runs").insert({
            "plan_id": body.plan_id,
            "user_id": user.id,
            "step_num": body.step_num,
            "field_key": body.field_key,
            "mode": mode,
            "prompt": prompt[:8000],
            "response": text[:16000],
            "tokens": len(text) // 4
        }).execute()
    except Exception as e:
        logger.warning(f"ai_run log failed: {e}")

    # Chunk + stream
    CHUNK = 28  # chars per token-like chunk
    buf = []
    for i in range(0, len(text), CHUNK):
        piece = text[i:i + CHUNK]
        buf.append(piece)
        yield f"event: chunk\ndata: {json.dumps({'text': piece})}\n\n"
        await asyncio.sleep(0.02)

    yield f"event: done\ndata: {json.dumps({'text': text})}\n\n"


async def _run_mode(mode: str, body: AIRunIn, user: CurrentUser, request: Request):
    await _ensure_step_access(user, body.step_num)
    return StreamingResponse(_stream_claude(mode, body, user), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive"
    })


@router.post("/answer-question")
async def answer_question(body: AIRunIn, request: Request, user: CurrentUser = Depends(require_user)):
    return await _run_mode("answer", body, user, request)


@router.post("/expand-answer")
async def expand_answer(body: AIRunIn, request: Request, user: CurrentUser = Depends(require_user)):
    return await _run_mode("expand", body, user, request)


@router.post("/refine")
async def refine(body: AIRunIn, request: Request, user: CurrentUser = Depends(require_user)):
    return await _run_mode("refine", body, user, request)


@router.post("/generate")
async def generate(body: AIRunIn, request: Request, user: CurrentUser = Depends(require_user)):
    return await _run_mode("generate", body, user, request)


@router.post("/synthesize")
async def synthesize(body: AIRunIn, request: Request, user: CurrentUser = Depends(require_user)):
    return await _run_mode("synthesize", body, user, request)


# Non-streaming JSON fallback (for tests / simple clients)
class AIRunJsonOut(BaseModel):
    text: str


@router.post("/answer-question/json", response_model=AIRunJsonOut)
async def answer_question_json(body: AIRunIn, user: CurrentUser = Depends(require_user)):
    await _ensure_step_access(user, body.step_num)
    plan_context = await _build_plan_context(user, body.plan_id)
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"json-{user.id}-{body.field_key}", system_message=_system_for("answer")).with_model(*MODEL)
    msg = UserMessage(text=_user_prompt("answer", body, plan_context))
    text = await chat.send_message(msg)
    return {"text": text}


# ============================== PORTRAIT GENERATION ==============================
# Generates a photorealistic Dream Customer avatar via Gemini Nano Banana.
# Uploads result to Supabase Storage (reuses iif-logos bucket) and persists URL
# as plan_inputs.dc_photo. Frees the user from finding stock photos.
import base64 as _b64
import uuid as _uuid

PORTRAIT_BUCKET = "iif-logos"  # reuse existing bucket (RLS already configured)


class PortraitIn(BaseModel):
    plan_id: str
    style: Optional[str] = "editorial-portrait"  # editorial-portrait | corporate | candid | stylized


def _build_portrait_prompt(plan_inputs: List[dict], style: str) -> str:
    """Synthesize an image prompt from Demographics + Psychographics + Niche."""
    by = {}
    for row in plan_inputs:
        if row.get("step_num") == 2:
            by[row["field_key"]] = (row.get("value") or "").strip()
    demo_bits, psycho_bits = [], []
    for k, v in by.items():
        if not v:
            continue
        if k.startswith("demo_"):
            demo_bits.append(v[:120])
        elif k.startswith("psycho_"):
            psycho_bits.append(v[:120])
    name = by.get("dc_name") or "Dream Customer"
    niche = by.get("micro_niche_statement") or ""
    style_hints = {
        "editorial-portrait": "Editorial portrait photography, soft natural window light, shallow depth of field, warm cinematic color palette (creams, soft golds, charcoal), magazine-quality, hyper-realistic, 85mm lens, eye-level composition, neutral background.",
        "corporate": "Polished professional headshot, studio lighting, neutral muted background, modern business attire, confident expression.",
        "candid": "Candid lifestyle photography, natural environment, golden hour light, authentic expression, slightly grainy film aesthetic.",
        "stylized": "Soft painterly portrait, slightly stylized realism, refined color grading, premium editorial feel.",
    }.get(style, "")
    return (
        f"A single photorealistic portrait of one person named {name}, "
        f"described by these traits — Demographics: {' | '.join(demo_bits) or 'unspecified'}. "
        f"Psychographics: {' | '.join(psycho_bits) or 'unspecified'}. "
        + (f"Their niche: {niche}. " if niche else "")
        + style_hints
        + " The portrait should be respectful, dignified, and inspirational. Avoid logos, brand marks, text, captions, or any watermarks. Square 1:1 aspect ratio."
    )


@router.post("/generate-portrait")
async def generate_portrait(body: PortraitIn, user: CurrentUser = Depends(require_user)):
    """Generate a Dream Customer portrait via Gemini Nano Banana, store it,
    persist plan_inputs.dc_photo, and return the URL.

    Step 2 is free, so no Pro gate.
    """
    # Verify ownership
    cli = anon_client_with_token(user.token)
    own = cli.table("plans").select("id").eq("id", body.plan_id).limit(1).execute()
    if not own.data:
        raise HTTPException(status_code=404, detail="Plan not found.")

    # Gather plan_inputs to construct the prompt
    inp = cli.table("plan_inputs").select("step_num,field_key,value").eq("plan_id", body.plan_id).execute()
    prompt = _build_portrait_prompt(inp.data or [], body.style or "editorial-portrait")
    logger.info("Portrait prompt for plan %s: %s", body.plan_id, prompt[:200])

    # Call Nano Banana
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"portrait-{user.id}-{body.plan_id}-{_uuid.uuid4().hex[:6]}",
            system_message="You are an image generation specialist creating editorial-quality portrait photography.",
        ).with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        _, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    except Exception as e:
        logger.exception("Nano Banana image generation failed")
        raise HTTPException(status_code=502, detail=f"Image generation failed: {e}")

    if not images:
        raise HTTPException(status_code=502, detail="No image returned by the model.")

    img = images[0]
    try:
        image_bytes = _b64.b64decode(img["data"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Invalid image payload: {e}")

    mime = img.get("mime_type") or "image/png"
    ext = "png" if "png" in mime else ("jpg" if "jpeg" in mime or "jpg" in mime else "webp")
    object_path = f"{body.plan_id}/portrait_{_uuid.uuid4().hex[:8]}.{ext}"

    # Upload to Supabase Storage
    try:
        admin.storage.from_(PORTRAIT_BUCKET).upload(
            path=object_path,
            file=image_bytes,
            file_options={"content-type": mime, "cache-control": "3600", "upsert": "false"},
        )
    except Exception as e:
        logger.exception("Storage upload failed")
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    public_url = admin.storage.from_(PORTRAIT_BUCKET).get_public_url(object_path)

    # Persist URL as plan_inputs.dc_photo
    try:
        admin.table("plan_inputs").upsert(
            {"plan_id": body.plan_id, "step_num": 2, "field_key": "dc_photo", "value": public_url},
            on_conflict="plan_id,step_num,field_key",
        ).execute()
    except Exception as e:
        logger.warning("Persist dc_photo failed: %s", e)

    return {"url": public_url, "path": object_path}



# ============================== AI TO-DO LIST (Business Plan) ==============================
class TodoIn(BaseModel):
    plan_id: str


@router.post("/business-plan-todos")
async def business_plan_todos(body: TodoIn, user: CurrentUser = Depends(require_user)):
    """Generate a 10-item, prioritized to-do list based on the user's full plan context.

    Returns JSON: {"todos": [{"title": "...", "rationale": "...", "step": <int 1-7>}, ...]}.
    Requires Pro (because it relies on all 7 steps of context).
    """
    await _ensure_step_access(user, 7)
    plan_context = await _build_plan_context(user, body.plan_id)
    instructions = (
        "Based on the user's FULL business plan context, output the 10 most important things they should DO NEXT, "
        "in priority order (1 = most urgent). Be concrete and action-oriented (not philosophical). "
        "Each item should be doable within 1–2 weeks if focused. "
        "Return ONLY a JSON object: {\"todos\": [{\"title\": \"<7-12 words, imperative\", \"rationale\": \"<1 sentence, max 25 words, why this is urgent\", \"step\": <int 1-7 matching the step this addresses>}, ...10 items]}. "
        "No markdown, no preamble — just JSON starting with { and ending with }."
    )
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"todo-{user.id}-{body.plan_id}", system_message=_system_for("synthesize")).with_model(*MODEL)
    text = await chat.send_message(UserMessage(text=instructions + "\n\nCONTEXT:\n" + plan_context))
    # Strip code fences if any
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # remove fenced wrapper
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    # Persist on the plan so it survives reload
    try:
        admin.table("plan_inputs").upsert(
            {"plan_id": body.plan_id, "step_num": 7, "field_key": "business_plan_todos_json", "value": cleaned},
            on_conflict="plan_id,step_num,field_key",
        ).execute()
    except Exception as e:
        logger.warning("Persist todos failed: %s", e)
    return {"text": cleaned}
