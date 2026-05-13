"""PDF + DOCX export endpoints for plans."""
from io import BytesIO
from typing import Dict, List, Any
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
)
from reportlab.pdfgen import canvas as pdfcanvas

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

from auth_supabase import require_user, anon_client_with_token, CurrentUser
from access import has_pro_access

router = APIRouter(prefix="/plans", tags=["exports"])

# ----------------------- Brand palette -----------------------
BRAND_CHARCOAL = HexColor("#14100C")
BRAND_GOLD = HexColor("#D4AF37")
BRAND_BRONZE = HexColor("#8B6F2A")
BRAND_CREAM = HexColor("#F8F2E5")
BRAND_MUTED = HexColor("#6B6359")

STEP_TITLES = {
    1: ("DEFINE", "Your Purpose"),
    2: ("EXTRACT", "Your Audience"),
    3: ("FRAME", "Your Story"),
    4: ("IGNITE", "Your Brand"),
    5: ("NURTURE", "The Transformation"),
    6: ("EXPAND", "Your Influence"),
    7: ("DELIVER", "Exceptional Service"),
}


def _safe_json(raw):
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


def _by_key(inputs: List[dict]) -> Dict[int, Dict[str, str]]:
    """Group plan_inputs into {step_num: {field_key: value}}."""
    out: Dict[int, Dict[str, str]] = {}
    for row in inputs:
        sn = row.get("step_num")
        if not sn:
            continue
        out.setdefault(sn, {})[row.get("field_key")] = row.get("value") or ""
    return out


# Map of (step_num, field_key) -> human label, for primary fields we want to surface.
LABELS: Dict[int, List[tuple]] = {
    1: [
        ("business_name", "Business Name"),
        ("mtp_statement", "Massive Transformative Purpose"),
        ("fp_q5", "Purpose Statement"),
        ("why_level_7", "Deep WHY"),
        ("chief_q3_what", "3-Month Goal (WHAT)"),
        ("chief_y1_what", "1-Year Goal (WHAT)"),
        ("chief_y3_what", "3-Year Goal (WHAT)"),
        ("chief_y5_what", "5-Year Goal (WHAT)"),
        ("structure_chosen", "Business Structure"),
    ],
    2: [
        ("avatar_name", "Avatar Name"),
        ("avatar_age", "Avatar Age"),
        ("avatar_occupation", "Avatar Occupation"),
        ("avatar_pain", "Avatar Pain"),
        ("avatar_desire", "Avatar Desire"),
    ],
    3: [
        ("brand_voice_statement", "Brand Voice"),
    ],
    5: [
        ("cp_name", "Continuity Program"),
        ("cp_price", "Continuity Price"),
        ("cp_what_monthly", "Continuity — Monthly Value"),
    ],
}


def _watermark(canvas, doc):
    """Diagonal watermark drawn on every page (free tier only)."""
    canvas.saveState()
    canvas.setFont("Helvetica-Bold", 70)
    canvas.setFillColor(Color(0.85, 0.85, 0.85, alpha=0.30))
    canvas.translate(LETTER[0] / 2, LETTER[1] / 2)
    canvas.rotate(45)
    canvas.drawCentredString(0, 0, "FREE PREVIEW")
    canvas.setFont("Helvetica", 14)
    canvas.drawCentredString(0, -50, "Upgrade to Pro for clean export")
    canvas.restoreState()


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(BRAND_MUTED)
    canvas.drawString(0.6 * inch, 0.4 * inch, "The Influence Incubator Formula · A 7-Step Plan")
    canvas.drawRightString(LETTER[0] - 0.6 * inch, 0.4 * inch, f"Page {doc.page}")
    canvas.restoreState()


def _on_page_free(canvas, doc):
    _watermark(canvas, doc)
    _footer(canvas, doc)


def _on_page_pro(canvas, doc):
    _footer(canvas, doc)


def _build_styles():
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle("title", parent=base["Title"], fontName="Helvetica-Bold", fontSize=28, textColor=BRAND_CHARCOAL, spaceAfter=8, leading=32),
        "subtitle": ParagraphStyle("subtitle", parent=base["Normal"], fontName="Helvetica-Oblique", fontSize=13, textColor=BRAND_BRONZE, spaceAfter=18),
        "eyebrow": ParagraphStyle("eyebrow", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8, textColor=BRAND_BRONZE, spaceAfter=4, leading=10),
        "stepHeading": ParagraphStyle("stepHeading", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=22, textColor=BRAND_CHARCOAL, spaceBefore=4, spaceAfter=10, leading=26),
        "sectionHeading": ParagraphStyle("sectionHeading", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=13, textColor=BRAND_CHARCOAL, spaceBefore=10, spaceAfter=4, leading=16),
        "label": ParagraphStyle("label", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=9, textColor=BRAND_BRONZE, spaceAfter=2, leading=11),
        "body": ParagraphStyle("body", parent=base["Normal"], fontName="Helvetica", fontSize=10.5, textColor=BRAND_CHARCOAL, leading=15, spaceAfter=6),
        "italic": ParagraphStyle("italic", parent=base["Normal"], fontName="Helvetica-Oblique", fontSize=10.5, textColor=BRAND_MUTED, leading=15, spaceAfter=6),
        "muted": ParagraphStyle("muted", parent=base["Normal"], fontName="Helvetica", fontSize=9.5, textColor=BRAND_MUTED, leading=13, spaceAfter=4),
    }
    return styles


def _para(text, style):
    """HTML-escape and create a Paragraph. Returns Spacer for empty text."""
    if not text:
        return Spacer(1, 0)
    safe = (str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>"))
    return Paragraph(safe, style)


def _build_pdf(plan: dict, inputs: List[dict], is_pro: bool) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=LETTER,
        leftMargin=0.7 * inch, rightMargin=0.7 * inch,
        topMargin=0.7 * inch, bottomMargin=0.8 * inch,
        title=plan.get("title") or "Plan",
        author="Influence Incubator Formula",
    )
    styles = _build_styles()
    data = _by_key(inputs)
    story = []

    # Cover
    story.append(_para("THE INFLUENCE INCUBATOR FORMULA", styles["eyebrow"]))
    story.append(_para(plan.get("title") or "Untitled Plan", styles["title"]))
    story.append(_para("A 7-Step Business Plan", styles["subtitle"]))
    if not is_pro:
        story.append(_para("Free preview — upgrade to Pro for the full export without watermark and to enable Word format.", styles["italic"]))
    story.append(Spacer(1, 14))

    for step_num in range(1, 8):
        verb, tail = STEP_TITLES[step_num]
        story.append(PageBreak())
        story.append(_para(f"STEP 0{step_num}", styles["eyebrow"]))
        story.append(_para(f"{verb} <font color='#8B6F2A'>{tail}</font>", styles["stepHeading"]))
        step_data = data.get(step_num, {})

        if not step_data:
            story.append(_para("No entries yet for this step.", styles["italic"]))
            continue

        # Known labeled fields
        for fk, label in LABELS.get(step_num, []):
            v = step_data.get(fk)
            if v:
                story.append(_para(label.upper(), styles["label"]))
                story.append(_para(v, styles["body"]))

        # Step-specific structured renderings
        if step_num == 3:
            _render_step3(step_data, story, styles)
        elif step_num == 4:
            _render_step4(step_data, story, styles)
        elif step_num == 5:
            _render_step5(step_data, story, styles)
        elif step_num == 6:
            _render_step6(step_data, story, styles)
        elif step_num == 7:
            _render_step7(step_data, story, styles)

    on_page = _on_page_free if not is_pro else _on_page_pro
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    return buf.getvalue()


def _render_step3(d: Dict[str, str], story, styles):
    """Offers list (HSO + Important Stories)."""
    try:
        offer_ids = json.loads(d.get("offer_ids") or "[]")
    except Exception:
        offer_ids = []
    if not offer_ids:
        return
    story.append(Spacer(1, 8))
    story.append(_para("OFFERS", styles["label"]))
    for i, oid in enumerate(offer_ids):
        name = d.get(f"{oid}_name") or f"Offer {i + 1}"
        price = d.get(f"{oid}_price") or ""
        hook = d.get(f"{oid}_hook")
        stry = d.get(f"{oid}_story")
        promise = d.get(f"{oid}_promise")
        elevator = d.get(f"{oid}_elevator")
        story.append(_para(f"<b>{name}</b>" + (f" — <font color='#8B6F2A'>{price}</font>" if price else ""), styles["sectionHeading"]))
        if hook: story.append(_para(f"<i>Hook:</i> {hook}", styles["body"]))
        if stry: story.append(_para(f"<i>Story:</i> {stry}", styles["body"]))
        if promise: story.append(_para(f"<i>Promise:</i> {promise}", styles["body"]))
        if elevator: story.append(_para(f"<i>Elevator Pitch:</i> {elevator}", styles["body"]))


def _render_step4(d: Dict[str, str], story, styles):
    """Archetype + palette + typography + channels."""
    primary = d.get("archetype_primary")
    secondary = d.get("archetype_secondary")
    if primary or secondary:
        story.append(_para("ARCHETYPE", styles["label"]))
        s = primary or "—"
        if secondary:
            s += f" · with {secondary}"
        story.append(_para(s, styles["body"]))
    site_tpl = d.get("site_template")
    if site_tpl:
        story.append(_para("WEBSITE TEMPLATE", styles["label"]))
        story.append(_para(site_tpl, styles["body"]))
    palette_chosen = d.get("palette_chosen")
    if palette_chosen:
        story.append(_para("CHOSEN PALETTE", styles["label"]))
        story.append(_para(palette_chosen, styles["body"]))
    typo_chosen = d.get("typography_chosen")
    if typo_chosen:
        story.append(_para("CHOSEN TYPOGRAPHY", styles["label"]))
        story.append(_para(typo_chosen, styles["body"]))


def _render_step5(d: Dict[str, str], story, styles):
    """Framework, SaaS, Community."""
    fw = _safe_json(d.get("framework_json"))
    if fw:
        story.append(_para("TRANSFORMATIVE FRAMEWORK", styles["label"]))
        story.append(_para(f"<b>{fw.get('name', '—')}</b> — <i>{fw.get('tagline', '')}</i>", styles["body"]))
        for i, ph in enumerate(fw.get("phases") or []):
            line = f"{i + 1}. <b>{ph.get('verb', '')} {ph.get('name', '')}</b>"
            if ph.get("transformation"): line += f" — <i>{ph['transformation']}</i>"
            if ph.get("description"): line += f"<br/>&nbsp;&nbsp;&nbsp;{ph['description']}"
            story.append(_para(line, styles["body"]))
    saas = _safe_json(d.get("saas_options_json"))
    if saas and saas.get("options"):
        story.append(_para("SAAS OPPORTUNITIES", styles["label"]))
        for o in saas["options"]:
            story.append(_para(f"<b>{o.get('name', 'Option')}</b> — {o.get('problem', '')}", styles["body"]))
    com = _safe_json(d.get("community_json"))
    if com:
        story.append(_para("COMMUNITY", styles["label"]))
        story.append(_para(f"<b>{com.get('name', '—')}</b> — {com.get('member_archetype', '')}", styles["body"]))


def _render_step6(d: Dict[str, str], story, styles):
    """Dream 100 summary + Book outline."""
    try:
        d100 = json.loads(d.get("dream100_list") or "[]")
    except Exception:
        d100 = []
    if d100:
        story.append(_para(f"DREAM 100 — {len(d100)} entries", styles["label"]))
    outline = _safe_json(d.get("book_outline_json"))
    if outline:
        story.append(_para("BOOK", styles["label"]))
        story.append(_para(f"<b>{outline.get('title', '—')}</b> — <i>{outline.get('subtitle', '')}</i>", styles["body"]))
        chapters = outline.get("chapters") or []
        if chapters:
            story.append(_para(f"{len(chapters)} chapters outlined", styles["muted"]))


def _render_step7(d: Dict[str, str], story, styles):
    """Journey, Onboarding, Retention summaries."""
    journey = _safe_json(d.get("journey_json"))
    if journey and journey.get("stages"):
        story.append(_para(f"CUSTOMER JOURNEY — {len(journey['stages'])} stages mapped", styles["label"]))
    onb = _safe_json(d.get("onboarding_json"))
    if onb and onb.get("sequence"):
        story.append(_para(f"ONBOARDING SEQUENCE — {len(onb['sequence'])} touchpoints", styles["label"]))
    ret = _safe_json(d.get("retention_json"))
    if ret and ret.get("plays"):
        story.append(_para(f"SURPRISE & DELIGHT — {len(ret['plays'])} plays", styles["label"]))
    sla = d.get("dq_response_sla")
    if sla:
        story.append(_para("RESPONSE SLA", styles["label"]))
        story.append(_para(sla, styles["body"]))


# =============================== DOCX ===============================

def _build_docx(plan: dict, inputs: List[dict]) -> bytes:
    doc = Document()
    # Margins
    for section in doc.sections:
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.8)

    data = _by_key(inputs)

    # Cover
    p = doc.add_paragraph()
    r = p.add_run("THE INFLUENCE INCUBATOR FORMULA")
    r.bold = True
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(0x8B, 0x6F, 0x2A)

    title = doc.add_paragraph()
    rt = title.add_run(plan.get("title") or "Untitled Plan")
    rt.bold = True
    rt.font.size = Pt(28)

    sub = doc.add_paragraph()
    rs = sub.add_run("A 7-Step Business Plan")
    rs.italic = True
    rs.font.size = Pt(13)
    rs.font.color.rgb = RGBColor(0x8B, 0x6F, 0x2A)

    for step_num in range(1, 8):
        doc.add_page_break()
        verb, tail = STEP_TITLES[step_num]
        eyebrow = doc.add_paragraph()
        eb = eyebrow.add_run(f"STEP 0{step_num}")
        eb.bold = True
        eb.font.size = Pt(8)
        eb.font.color.rgb = RGBColor(0x8B, 0x6F, 0x2A)

        heading = doc.add_paragraph()
        rh = heading.add_run(f"{verb} ")
        rh.bold = True
        rh.font.size = Pt(22)
        rt = heading.add_run(tail)
        rt.bold = True
        rt.font.size = Pt(22)
        rt.font.color.rgb = RGBColor(0x8B, 0x6F, 0x2A)

        step_data = data.get(step_num, {})
        if not step_data:
            doc.add_paragraph("No entries yet for this step.").italic = True
            continue

        for fk, label in LABELS.get(step_num, []):
            v = step_data.get(fk)
            if v:
                lp = doc.add_paragraph()
                lr = lp.add_run(label.upper())
                lr.bold = True
                lr.font.size = Pt(9)
                lr.font.color.rgb = RGBColor(0x8B, 0x6F, 0x2A)
                doc.add_paragraph(v)

        # Reuse PDF renderers' logic where possible by emitting plain text into docx
        _docx_step_extras(doc, step_num, step_data)

    out = BytesIO()
    doc.save(out)
    return out.getvalue()


def _docx_step_extras(doc: Document, step_num: int, d: Dict[str, str]):
    if step_num == 3:
        try:
            offer_ids = json.loads(d.get("offer_ids") or "[]")
        except Exception:
            offer_ids = []
        for i, oid in enumerate(offer_ids):
            name = d.get(f"{oid}_name") or f"Offer {i + 1}"
            price = d.get(f"{oid}_price") or ""
            p = doc.add_paragraph()
            r = p.add_run(name)
            r.bold = True
            r.font.size = Pt(13)
            if price:
                r2 = p.add_run(f"  —  {price}")
                r2.font.color.rgb = RGBColor(0x8B, 0x6F, 0x2A)
            for key, label in [("hook", "Hook"), ("story", "Story"), ("promise", "Promise"), ("elevator", "Elevator Pitch")]:
                v = d.get(f"{oid}_{key}")
                if v:
                    pp = doc.add_paragraph()
                    rr = pp.add_run(f"{label}: ")
                    rr.bold = True
                    pp.add_run(v)
    elif step_num == 5:
        fw = _safe_json(d.get("framework_json"))
        if fw and fw.get("phases"):
            for i, ph in enumerate(fw["phases"]):
                doc.add_paragraph(f"{i + 1}. {ph.get('verb', '')} {ph.get('name', '')} — {ph.get('transformation', '')}")
    elif step_num == 6:
        outline = _safe_json(d.get("book_outline_json"))
        if outline and outline.get("chapters"):
            for ch in outline["chapters"]:
                doc.add_paragraph(f"{ch.get('n', '')}. {ch.get('title', '')}")


# =============================== ENDPOINTS ===============================

async def _load_plan_and_inputs(plan_id: str, user: CurrentUser):
    cli = anon_client_with_token(user.token)
    res = cli.table("plans").select("*").eq("id", plan_id).limit(1).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan = res.data[0]
    inputs = cli.table("plan_inputs").select("*").eq("plan_id", plan_id).execute().data or []
    profile_res = cli.table("profiles").select("*").eq("id", user.id).limit(1).execute()
    profile = profile_res.data[0] if profile_res.data else None
    is_pro = has_pro_access(profile)
    return plan, inputs, is_pro


def _safe_filename(name: str) -> str:
    s = "".join(c if c.isalnum() or c in (" ", "-", "_") else "_" for c in (name or "Plan"))
    return s.strip().replace(" ", "_")[:80] or "Plan"


@router.get("/{plan_id}/export.pdf")
async def export_pdf(plan_id: str, user: CurrentUser = Depends(require_user)):
    plan, inputs, is_pro = await _load_plan_and_inputs(plan_id, user)
    pdf_bytes = _build_pdf(plan, inputs, is_pro)
    filename = f"{_safe_filename(plan.get('title') or 'Plan')}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/{plan_id}/export.docx")
async def export_docx(plan_id: str, user: CurrentUser = Depends(require_user)):
    plan, inputs, is_pro = await _load_plan_and_inputs(plan_id, user)
    if not is_pro:
        raise HTTPException(status_code=402, detail={"code": "pro_required", "message": "Word export is a Pro feature. Upgrade to download as .docx."})
    docx_bytes = _build_docx(plan, inputs)
    filename = f"{_safe_filename(plan.get('title') or 'Plan')}.docx"
    return StreamingResponse(
        BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
