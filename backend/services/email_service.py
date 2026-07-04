"""Transactional email service via SMTP (Google Workspace).

All emails are fire-and-forget via asyncio.create_task so they never block
request handlers. Failures are logged but never raised.

Env vars:
  SMTP_HOST, SMTP_PORT, SMTP_USE_TLS, SMTP_USERNAME, SMTP_PASSWORD,
  SMTP_FROM_EMAIL, SMTP_FROM_NAME
"""
from __future__ import annotations

import asyncio
import logging
import os
from email.message import EmailMessage
from typing import Optional

import aiosmtplib

logger = logging.getLogger("iif.email")

SMTP_HOST = os.environ.get("SMTP_HOST", "").strip()
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "").strip()
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "").strip()
SMTP_FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", SMTP_USERNAME).strip()
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "The Influence Incubator").strip()

APP_BRAND = "The Influence Incubator Formula"
BRAND_GOLD = "#D2B56A"
BRAND_CHARCOAL = "#292822"
BRAND_CREAM = "#FAF7F0"


def _enabled() -> bool:
    return bool(SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD and SMTP_FROM_EMAIL)


async def _send(to: str, subject: str, html: str, text: Optional[str] = None) -> bool:
    """Low-level send. Returns True on success, False on any failure."""
    if not _enabled():
        logger.warning("SMTP not configured — skipping email to %s (%s)", to, subject)
        return False
    msg = EmailMessage()
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text or _html_to_text(html))
    msg.add_alternative(html, subtype="html")
    try:
        # Port 587 -> STARTTLS; port 465 -> implicit SSL
        if SMTP_PORT == 465:
            await aiosmtplib.send(
                msg, hostname=SMTP_HOST, port=SMTP_PORT, use_tls=True,
                username=SMTP_USERNAME, password=SMTP_PASSWORD, timeout=15,
            )
        else:
            await aiosmtplib.send(
                msg, hostname=SMTP_HOST, port=SMTP_PORT, start_tls=SMTP_USE_TLS,
                username=SMTP_USERNAME, password=SMTP_PASSWORD, timeout=15,
            )
        logger.info("Sent email to %s: %s", to, subject)
        return True
    except Exception as e:
        logger.exception("SMTP send failed to %s (%s): %s", to, subject, e)
        return False


def _html_to_text(html: str) -> str:
    """Very small fallback plain-text extractor."""
    import re
    text = re.sub(r"<[^>]+>", "", html)
    text = re.sub(r"\n\s*\n", "\n\n", text).strip()
    return text


def _wrap(preheader: str, body_html: str) -> str:
    """Wrap the body in a branded editorial template."""
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{APP_BRAND}</title></head>
<body style="margin:0;padding:0;background:{BRAND_CREAM};font-family:Georgia,'Times New Roman',serif;color:{BRAND_CHARCOAL};">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;">{preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{BRAND_CREAM};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.08);overflow:hidden;">
<tr><td style="background:{BRAND_CHARCOAL};padding:24px 32px;text-align:left;">
<div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.18em;color:{BRAND_GOLD};text-transform:uppercase;">The Influence Incubator</div>
<div style="font-family:Georgia,serif;font-size:26px;color:{BRAND_CREAM};margin-top:4px;font-style:italic;">Formula</div>
</td></tr>
<tr><td style="padding:32px;line-height:1.6;font-size:16px;">
{body_html}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #eee;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#888;line-height:1.5;">
Influence Incubator LLC &middot; Dr Brandt Gibson LLC &middot; Utah, USA<br/>
Questions? Reply to this email or contact <a href="mailto:support@influenceincubator.xyz" style="color:{BRAND_GOLD};">support@influenceincubator.xyz</a>.
</td></tr>
</table>
</td></tr></table>
</body></html>"""


def _button(label: str, url: str) -> str:
    return (
        f'<div style="text-align:center;margin:28px 0;">'
        f'<a href="{url}" style="display:inline-block;background:#EE3524;color:#FFFFFF;padding:14px 28px;'
        f'text-decoration:none;border-radius:999px;font-family:\'Helvetica Neue\',Arial,sans-serif;'
        f'font-weight:600;font-size:14px;letter-spacing:0.02em;">{label}</a></div>'
    )


# ============================== PUBLIC EMAIL HELPERS ==============================

async def send_welcome(to: str, name: Optional[str], app_url: str) -> bool:
    hello = f"Welcome, {name}." if name else "Welcome."
    body = f"""
<div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.18em;color:#86653A;text-transform:uppercase;">Step 01 begins</div>
<h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.2;margin:6px 0 16px;letter-spacing:-0.5px;">{hello}</h1>
<p>Your account is live. Steps 1 & 2 are free — you can already start defining your purpose and identifying your Dream Customer.</p>
<p style="color:#666;">Working through the full 7-step Formula requires Pro. When you're ready, unlock the rest — one Monthly, Lifetime, or Lifetime Unlimited plan.</p>
{_button("Start Step 01 →", f"{app_url}/dashboard")}
<p style="color:#666;font-size:14px;">Quick tip: use the AI-assist buttons on every question. They're grounded in your other answers, so the more you fill in, the sharper the drafts get.</p>
"""
    return await _send(to, "Welcome to The Influence Incubator Formula", _wrap("Your account is live — Steps 1 & 2 are free.", body))


async def send_plan_ready(to: str, name: Optional[str], plan_title: str, business_plan_url: str) -> bool:
    hello = f"You did it, {name}." if name else "You did it."
    body = f"""
<div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.18em;color:#86653A;text-transform:uppercase;">All 7 steps complete</div>
<h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.2;margin:6px 0 16px;letter-spacing:-0.5px;">{hello}</h1>
<p>Your Business Plan for <strong>"{plan_title}"</strong> is ready. It combines all 7 step cards — DEFINE, Dream Customer, FRAME, IGNITE, NURTURE, EXPAND, DELIVER — into one publishable summary you can share, print, or export.</p>
{_button("View my Business Plan →", business_plan_url)}
<p style="color:#666;font-size:14px;">Inside you'll also find an AI-prioritized 10-step Do-This-Next list based on your unique plan. Tap "Generate my 10-step list" on the page to synthesize it in seconds.</p>
"""
    return await _send(to, f'Your Business Plan for "{plan_title}" is ready', _wrap(f"Your 7-step Business Plan for {plan_title} is complete.", body))


async def send_refund_confirmation(to: str, name: Optional[str], amount_display: str, expected_days: int = 5) -> bool:
    hello = f"Confirmed, {name}." if name else "Refund confirmed."
    body = f"""
<div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:0.18em;color:#86653A;text-transform:uppercase;">Refund confirmation</div>
<h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.2;margin:6px 0 16px;letter-spacing:-0.5px;">{hello}</h1>
<p>We've processed a refund of <strong>{amount_display}</strong> to your original payment method.</p>
<p>Depending on your card issuer or bank, funds typically appear on your statement within <strong>{expected_days} business days</strong>. In some cases it may take up to 10.</p>
<p>Your account has been downgraded to the Free tier. Your plans and content remain — Steps 1 & 2 stay unlocked. You can re-upgrade anytime.</p>
<p style="color:#666;font-size:14px;">If anything about this refund looks wrong, reply to this email and a real human will look into it.</p>
"""
    return await _send(to, f"Your refund of {amount_display} is on the way", _wrap(f"We've processed your refund of {amount_display}.", body))


def send_async(coro):
    """Fire-and-forget helper for use inside sync webhook handlers.
    Schedules the coroutine on the running loop if any, else runs in background.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(coro)
        else:
            loop.run_until_complete(coro)
    except RuntimeError:
        # No running loop — spin up a temp one
        asyncio.new_event_loop().run_until_complete(coro)
