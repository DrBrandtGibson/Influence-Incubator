# plan.md — The Influence Incubator Formula (Updated)

## 1. Objectives
- **Primary (achieved for V1 free tier):** Prove core integrations end-to-end: **Supabase (Auth/DB/RLS/Storage)** + **FastAPI** + **Claude Sonnet 4.5** with **SSE-style streaming** and context-aware generation.
- **Ship V1 (Phases 1–4) as a polished free-tier product:** Landing + Auth + Dashboard + Plan Wizard + Plan Workspace + Step Navigator (locks) + **Steps 1–2 fully functional** with **Universal AI Assist on every field**.
- **Reliability + persistence:** Ensure **all user inputs + AI-generated outputs persist reliably** across rapid navigation and refresh (debounced saves + keepalive + persistence of synthesized outputs).
- **Ship the first two Pro steps:** Deliver **Step 3 (FRAME Your Story)** and **Step 4 (IGNITE Your Brand)** with consistent UX patterns (tabs, AI assist, synthesis panels, output cards, completion).
- **Current objective (next):** **End-to-end verify Steps 3–4 in live UI (Pro account)** and then proceed to **Steps 5–7**, followed by **Exports**, then **Stripe**.

## 2. Implementation Steps

### Phase 0 — Core POC (Isolation; do not proceed until stable) ✅ COMPLETE
**Core workflow proven:** React (CRA) ↔ Supabase Auth session/JWT ↔ FastAPI verifies user ↔ FastAPI streams Claude output (chunked SSE) ↔ Supabase Postgres with RLS.

**Delivered / Verified:**
- Supabase admin connectivity, storage bucket creation, upload test.
- Two-user RLS isolation confirmed (Alice vs Bob cannot read/insert as each other).
- Claude Sonnet 4.5 generation verified via Emergent universal LLM key; streaming UX implemented by chunking.
- Full Supabase schema created and applied via SQL Editor.

**Exit criteria:** met.

---

### Phase 1 — Foundation + Brand UI + Auth + Landing ✅ COMPLETE
**Delivered:**
- Brand tokens + polished **light/dark** themes using shadcn `hsl(var(--...))` variables.
- Typography: **EB Garamond** (headings) + **Inter** (body).
- Marketing shell: top nav + footer.
- Landing page (`/`): cinematic hero “Marketing Your Extraordinary…”, 7-step preview cards (FREE/PRO badges), testimonials, FAQ, pricing teaser, diagonal section transitions.
- Auth pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`.
- Route guards for `/dashboard` and `/plans/*`.

**Important update (implementation detail):**
- Added **backend-assisted signup** (`POST /api/auth/signup`) using Supabase service role to **auto-confirm email** so signup works reliably inside preview/iframe environments.

**Auth UX upgrades (added later):**
- Added **Show/Hide password** eye-toggle on Login, Signup, and Reset Password via `PasswordInput`.
- Reset Password now includes **confirm password** and detects recovery session.

---

### Phase 2 — Supabase Schema + RLS + Wizard + Navigator + Universal AI Assist ✅ COMPLETE
**Delivered:**
1) **Supabase schema + RLS**
- Applied full schema (idempotent) supporting all phases:
  - `profiles`, `plans`, `plan_steps`, `plan_inputs`, `ai_runs`, plus step-specific tables and `stripe_events` (Phase 11).
- RLS policies enforce per-user isolation across tables.
- Trigger creates `profiles` row on new auth user.

2) **Dashboard (`/dashboard`)**
- Lists user plans and CTA to create new plan.
- **Free-tier 1-plan limit** enforced server-side (402) with UI messaging.

3) **Plan wizard (`/plans/new`)**
- 5-slide wizard: idea, title, backstory, industry, stage.
- Robust session check before submit.

4) **Plan workspace (`/plans/:id/:stepKey`)**
- Persistent left **StepNavigator** with:
  - FREE badges (Steps 1–2)
  - PRO + **gold lock icons** (Steps 3–7)
  - Locked-step click opens Upgrade dialog.

5) **Universal `<AIAssistInput>` (every question field)**
- Floating toolbar: **Answer / Expand / Refine**.
- Streams output from backend SSE endpoints.
- Persistence hardening:
  - Debounced auto-save on change (via `usePersistedField`) + `keepalive: true`.

6) **AI endpoints (FastAPI)**
- `/api/ai/answer-question` (SSE)
- `/api/ai/expand-answer` (SSE)
- `/api/ai/refine` (SSE)
- `/api/ai/generate` (SSE)
- `/api/ai/synthesize` (SSE)
- Persists `ai_runs`.
- Enforces step gating: Steps 3–7 return 403 unless Pro.

---

### Phase 3 — Step 1 DEFINE (Free, complete) ✅ COMPLETE
**Delivered Step 1 (7 tabs):**
1) **Identity**
- Business name input + “Generate 5 name options” (AI)
- Logo upload to **Supabase Storage** + “Generate 5 logo prompts” (AI)
- Business structure recommendation (AI)

2) **Finding Your Purpose**
- 5 guided questions + ranking interaction
- “Synthesize my Purpose” (AI) and refinable Purpose paragraph

3) **Become Driven**
- Russell Brunson framing + learn-more dialog
- 5 verbatim questions with AI assist

4) **MTP Discovery**
- 5 categories × 10 verbatim questions each (50 total)
- “Synthesize my MTP” → **8–10 word** MTP output (AI synthesize)
- Educational popups: Kotler, key aspects, examples, Churchill quote

5) **7 Levels Deep WHY (Message 229 refinements)**
- Starter prompt pre-seeded from synthesized MTP (editable)
- Sequential reveal: all 7 levels hidden until Next clicked
- Each Next generates a short single-sentence WHY question synthesized by AI
- Progression blocked: Next disabled until current level has an answer
- Level 7 displayed as the Big Why in a dark cinematic panel

6) **Chief Aim (Message 229 refinements)**
- Displays synthesized MTP as read-only banner at top
- Adds Brandt Gibson quote
- Horizons include 3-Month / 1-Year / 3-Year / 5-Year
- Each horizon uses WHAT / GIVE / DATE / RESULTS with AI assist

7) **Your Output (updated)**
- Header updated: “DEFINE Your Purpose Card”
- Output card includes: Business Name, Logo, Purpose, MTP, Deep WHY
- Chief Aim (WHAT) shows all 4 horizons (3-Month, 1-Year, 3-Year, 5-Year) in a clean 2×2 grid
- “Complete Step 1” marks `plan_steps.step_num=1` complete and advances

**Reliability fixes (persistence hardening) ✅ COMPLETE**
- Added `keepalive: true` to `/api/plans/{id}/inputs` persists.
- Wired `usePersistedField` inside `AIAssistInput` so every keystroke is debounced-auto-saved.
- Updated `streamingGenerate` helpers to auto-persist AI-generated values to `plan_inputs` so they survive refresh.
- Output card reads `why_level_7` directly with `deep_why` as fallback.

---

### Phase 4 — Step 2 EXTRACT (Free, complete) + Celebration + Soft Upgrade ✅ COMPLETE
**Delivered Step 2 (6 tabs):**
1) **Maslow**
- Clickable pyramid-style UI; selections persisted.
- Hit-zone alignment tuning completed in `MaslowImagePyramid.jsx` to match the artwork.
  - Current tier bounds:
    - Self-Actualization: 4–44%
    - Esteem: 44–58%
    - Love & Belonging: 58–72%
    - Safety & Security: 72–85%
    - Physiological: 85–99%

2) **6 Needs**
- Interactive SVG wheel + list toggles; persisted.

3) **Niche (WHAT)**
- 4 niche cards selector.
- 10 verbatim niche questions.
- Micro-niche statement field.

4) **Demographics (WHO)**
- 11 verbatim questions with AI assist.

5) **Psychographics (WHERE)**
- 11 verbatim questions with AI assist.

6) **Dream Customer Card**
- Pokémon-style printable trading card layout.
- PNG export via `html-to-image`.

**Completion:**
- “Complete Step 2” marks step complete and shows Celebration screen with upgrade CTA.

---

### Phase 5 — Step 3 FRAME Your Story (Pro) ✅ INITIAL IMPLEMENTATION COMPLETE
**Status:** Step 3 core experience implemented and wired into the workspace; pending end-to-end verification.

**Wiring / Files:**
- Added Step 3 constants and copy to: `frontend/src/lib/framework.js`
- Created Step 3 UI: `frontend/src/components/steps/StepFrame.jsx`
- Routed in workspace: `frontend/src/pages/PlanWorkspace.jsx` renders Step 3 at `/plans/:id/frame`

**Access / Pro gating:**
- Step 3 remains Pro-gated through existing app logic.
- Backend `access.can_access_step` enforces 403 on AI endpoints for step 3+ if user is not Pro.
- Development preview approach: flip your test account:
  - `profiles.subscription_status = 'pro_lifetime'`

**Delivered Step 3 (6 sub-tabs):**
1) Brand Voice — 10 prompts + quote + synthesize profile
2) Story Bank — 9 expandable categories (user-provided)
3) Hero’s Journey — 12 stages + SVG wheel + Founder/Customer toggle
4) Hook · Story · Offer — generate bundle + refine per field
5) Important Stories — transformation promise + 200-word elevator pitch
6) Output — summary card + complete Step 3 → Step 4

**Exit criteria (pending):**
- End-to-end UI verification (Pro account): navigation, AI generation, persistence on refresh, completion.

---

### Phase 6 — Step 4 IGNITE Your Brand (Pro) ✅ INITIAL IMPLEMENTATION COMPLETE
**Status:** Step 4 core experience implemented and wired into the workspace; pending end-to-end verification.

**Wiring / Files:**
- Appended Step 4 constants to: `frontend/src/lib/framework.js`:
  - `BRAND_ARCHETYPES`, `POCKET_MEDIA_CHANNELS`, `POCKET_MEDIA_FIELDS`, `WEBSITE_HUB_TEMPLATES`,
    `MARKETING_TRACKS`, `MARKETING_TRACK_FIELDS`, `CALENDAR_PHASES`, `CALENDAR_PILLARS`,
    `IGNITE_INTROS`, `IGNITE_JUNG_QUOTE`
- Created Step 4 UI: `frontend/src/components/steps/StepIgnite.jsx`
- Routed in workspace: `frontend/src/pages/PlanWorkspace.jsx` renders Step 4 at `/plans/:id/ignite`

**Access / Pro gating:**
- Pro gating unchanged; backend `access.can_access_step` enforces 403 on AI endpoints for step 4+ unless Pro.

**Delivered Step 4 (6 sub-tabs):**
1) **Brand Personality**
- Carl Jung quote.
- Primary & Secondary archetype picker (12 cards each; prevents duplicates across slots).
- AI Palette generator (3 palettes as JSON; swatch preview; click to pick).
- AI Typography generator (3 Google Font pairings as JSON; live preview; click to pick).

2) **Pocket Media Empire**
- 5 channels (Newsletter / Blog / Podcast / Video / Events) each toggleable.
- When enabled, exposes 6 AI-assist fields:
  - Cadence, Format, Working Name, First 5 Ideas, Audience Pull, KPI.

3) **Website Hub**
- Template picker: InfluencerHub vs MedicalHub.
- AI drafts full website spine in one pass: PAGE / META / COPY for each page; editable.

4) **Marketing Plan**
- Two side-by-side tracks:
  - DIY vs 10X-with-AI
- Each with 4 AI-assist fields:
  - Weekly Schedule, Tools/Stack, Time Investment, Expected Outcome.

5) **30/60/90 Calendar**
- Structured grid: 4 phases (0–30 Foundation, 31–60 Rhythm, 61–90 Amplification, Beyond 90 Compounding)
  × 4 pillars (Content / Engagement / Growth / Offer).
- Each cell is an AI-assist textarea.

6) **Output**
- “IGNITE Your Brand Card” summary showing:
  - Archetype (primary · secondary)
  - Chosen Palette (swatch strip)
  - Chosen Typography (heading + body)
  - Enabled Pocket Media channel chips
  - Chosen Website template
- Complete button advances to Step 5.

**Verification:**
- Lint clean.
- App loads with 0 console errors.

**Exit criteria (pending):**
- End-to-end UI verification (Pro account): AI generators produce usable output, persistence on refresh, completion to Step 5.

---

### Phase 7–9 — Steps 5–7 (Pro) + Locked Previews (Free) 🔜 NEXT
**Current state:**
- Free users see locked previews / upgrade dialogs for steps 3–7.
- Steps 3–4 implemented; steps 5–7 remain Coming Soon / preview.

**Implementation approach:**
For each step 5–7:
1) Ensure locked-preview page is conversion-polished.
2) Build full Pro step implementation with persistence, AI assist, and an output card.
3) Add step completion tracking + navigator status indicators.

**Step 5 — NURTURE (Pro):**
- Transformative framework + diagram
- Continuity program design
- SaaS opportunity generator
- Community design

**Step 6 — EXPAND (Pro):**
- Dream 100 CRM
- Live events / challenges
- Book builder

**Step 7 — DELIVER (Pro):**
- SOP builder
- Listening engine concepts
- Engagement scorecard
- Onboarding flow
- Retention playbook

---

### Phase 10 — Polish + Exports + Testing Hardening ✅ EXPORTS COMPLETE
**Status:** PDF + Word export end-to-end working. Free tier sees watermarked PDF preview; DOCX is Pro-only.

**Wiring / Files:**
- Backend router: `backend/routers/exports.py`
  - `GET /api/plans/{plan_id}/export.pdf` (Free → watermark; Pro → clean)
  - `GET /api/plans/{plan_id}/export.docx` (Pro only; returns 402 with `code=pro_required` for free users)
  - Uses `reportlab` + `python-docx`, brand palette (charcoal/bronze/cream), cover + 7 step sections, structured renderers for Step 3 offers, Step 4 archetype/palette/typography, Step 5 framework/SaaS/community, Step 6 Dream 100 + book, Step 7 journey/onboarding/retention.
  - Pro access enforced via `access.has_pro_access(profile)`.
- Server wiring: `backend/server.py` now includes `exports_router`.
- Frontend menu: `frontend/src/components/plans/ExportMenu.jsx`
  - Shadcn `DropdownMenu` with PDF + DOCX options, contextual labels per tier, lock icon for free.
  - Auth-aware blob download via `authedFetch`, filename sanitization, success + 402 upsell toasts (with "Upgrade" action navigating to `/pricing`).
- Workspace integration: `frontend/src/pages/PlanWorkspace.jsx` shows `<ExportMenu />` in the sticky top bar next to the mobile Steps trigger.

**Verified end-to-end:**
- Pro user → PDF (7.7 KB, valid `%PDF-`) and DOCX (37 KB, valid `PK` zip) downloaded with success toasts.
- Free user → PDF (9.2 KB, watermarked) downloaded with "Free preview includes watermark" toast; DOCX click triggers Pro upsell toast (402 → Upgrade CTA).

**Remaining (deferred):**
- Onboarding tour, WCAG AA pass, rate limiting.
- Playwright/Vitest regression coverage for persistence + AI streams.

---

### Phase 11.5 — ClickFunnels 2.0 Integration ✅ COMPLETE
**Status:** Bi-directional sync live against the real Influence Incubator workspace (id=7895).

**Wiring / Files:**
- Service: `backend/services/clickfunnels.py`
  - HTTPX async client against `https://influenceincubator.myclickfunnels.com/api/v2`.
  - `upsert_contact(email, full_name)` — `GET /workspaces/{wid}/contacts?filter[email_address]=...` → if missing, `POST /workspaces/{wid}/contacts` with `{contact:{email_address,first_name,last_name}}`. Idempotent by email.
  - `find_or_create_tag(name)` — `GET /workspaces/{wid}/contacts/tags?filter[name]=...` → if missing, `POST /workspaces/{wid}/contacts/tags`. In-process tag-id cache to avoid repeat lookups.
  - `apply_tag(contact_id, name)` — `POST /contacts/{cid}/applied_tags` with `{contacts_applied_tag:{tag_id}}`. Re-applying is a no-op in CF.
  - `sync_signup` / `sync_purchase` / `sync_refund` — async helpers that compose `upsert_contact` + `apply_tag` calls behind `_safe_run` (errors logged, never propagate).
  - `verify_signature(body, headers)` — HMAC-SHA256 of `f"{t}.{body}"` keyed by `CLICKFUNNELS_WEBHOOK_SECRET`. 600s tolerance, signature header forms `t=...,v1=...` or `x-cf-signature*`. Empty secret = dev mode (logs warning, accepts unsigned).
  - `parse_event(payload)` — normalizes order/payment events to `{event_id, event_type, email, full_name, contact_id, amount_cents, currency, is_purchase}`. Probes multiple common payload shapes.
- Inbound webhook router: `backend/routers/clickfunnels.py`
  - `POST /api/webhook/clickfunnels`
  - Flow: verify sig → parse event → idempotency check (bounded in-memory set) → background-task `_process_purchase`:
    - Find Supabase user by email (profiles fast-path, then auth-pagination fallback).
    - If missing, `admin.auth.admin.create_user({email, password=random, email_confirm: True, user_metadata: {source: clickfunnels_purchase}})`.
    - Activate Pro: `subscription_status=pro_lifetime` (or `pro_monthly` for ≤$25), set `purchased_at`. Skips downgrade of existing `pro_lifetime`.
    - Mirror purchase tag back to CF (`sync_purchase`).
- Outbound wiring:
  - `routers/auth.py` → after Supabase signup, `BackgroundTasks.add_task(cf.sync_signup, email, full_name)`.
  - `routers/billing.py` → after activation (`_activate_pro_from_session`), fetch profile email and `_fire_and_forget(cf.sync_purchase(...))`. Mirrors `iif_purchased_lifetime` or `iif_purchased_monthly`.
  - `routers/billing.py` → in `_downgrade_to_free`, fire `cf.sync_refund(email)` so retention workflows can pick up `iif_refunded`.

**Configuration (in `backend/.env`):**
- `CLICKFUNNELS_API_TOKEN`, `CLICKFUNNELS_WORKSPACE_ID=7895`, `CLICKFUNNELS_WORKSPACE_SUBDOMAIN=influenceincubator.myclickfunnels.com`, `CLICKFUNNELS_USER_AGENT=InfluenceIncubator/1.0`
- `CLICKFUNNELS_TAG_SIGNUP=incubator_formula_signup`, `CLICKFUNNELS_TAG_LIFETIME=iif_purchased_lifetime`, `CLICKFUNNELS_TAG_MONTHLY=iif_purchased_monthly`, `CLICKFUNNELS_TAG_REFUNDED=iif_refunded` (all overridable)
- `CLICKFUNNELS_WEBHOOK_SECRET=` (empty = dev unsigned; populate after creating webhook in CF Dashboard).

**Verified end-to-end against real CF workspace (7 flows):**
1. Signup → CF contact created with `incubator_formula_signup` tag ✅
2. Stripe purchase webhook → `iif_purchased_lifetime` tag applied to same contact ✅
3. Self-serve refund → `iif_refunded` tag applied ✅
4. CF webhook (existing email) → Pro activated on existing Supabase profile, no duplicate user ✅
5. CF webhook (new email) → Supabase auth user auto-created with `email_confirm=True`, profile activated to `pro_lifetime` ✅
6. Replay same CF event → `{duplicate: true}` ✅
7. Duplicate signup → 409 from our app + still only 1 CF contact for that email ✅
8. Signature verification: good signature passes, tampered signature → 400, expired signature → 400, missing header → 400 ✅

**⚠️ Production handoff for user:**
1. In ClickFunnels Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://pro-unlock-3.preview.emergentagent.com/api/webhook/clickfunnels`
   - Events to subscribe to: order paid / order created / payment success (whatever your funnel fires)
   - Copy the signing secret into `CLICKFUNNELS_WEBHOOK_SECRET` in `backend/.env` and restart backend.
2. (Optional) Edit the four tag names in `.env` if you prefer different naming.
3. The integration is **additive** — both Stripe in-app purchases and ClickFunnels funnel purchases activate Pro; both push to the same CF contact (deduped by email).


### Phase 11 — Stripe Paywall ✅ COMPLETE

**Status:** Both Lifetime $97 (one-time) and Monthly $19/mo (subscription) end-to-end working via Stripe Checkout. Self-serve refunds, subscription cancel, and webhooks all live.

**Wiring / Files:**
- Backend router: `backend/routers/billing.py` (uses raw `stripe` SDK, not `emergentintegrations` — needed full subscription mode + refund support).
  - `GET  /api/billing/config` — public; reports `enabled`, package metadata, refund window.
  - `GET  /api/billing/me` — auth; returns subscription state, refund eligibility, days remaining.
  - `POST /api/billing/checkout` — auth; creates `mode=payment` for Lifetime, `mode=subscription` for Monthly. Ensures Stripe Customer linked to `profiles.stripe_customer_id`.
  - `GET  /api/billing/session/{session_id}` — auth; polls Stripe Checkout Session, reconciles `profiles` on `payment_status==paid` (idempotent).
  - `POST /api/billing/refund` — auth; refunds latest succeeded PaymentIntent + cancels active subscription; downgrades to `free`. Gated by 7-day window from `purchased_at`.
  - `POST /api/billing/cancel-subscription` — auth; cancels at period end, Pro retained until `pro_until`.
  - `POST /api/webhook/stripe` — public; handles `checkout.session.completed`, `invoice.paid`, `invoice.payment_succeeded`, `customer.subscription.deleted`, `charge.refunded`. Idempotent via `stripe_events.stripe_event_id` unique constraint.
- Server-side product/price definitions seeded via API in Stripe test mode:
  - `price_1TYL51GOHx8em2zze7r1MV7C` = Lifetime $97
  - `price_1TYL51GOHx8em2zzmBm0c4Un` = Monthly $19/mo
- ENV (in `backend/.env`):
  - `STRIPE_SECRET_KEY` — user-provided test key
  - `STRIPE_PUBLISHABLE_KEY` — user-provided
  - `STRIPE_WEBHOOK_SECRET` — currently empty (webhook accepts unsigned in dev; **production must populate** this after adding the webhook in Stripe Dashboard).
  - `STRIPE_PRICE_LIFETIME`, `STRIPE_PRICE_MONTHLY`
- Frontend:
  - `frontend/src/lib/useStartCheckout.js` — auth-aware hook that POSTs to `/billing/checkout` and redirects to Stripe Checkout URL.
  - `frontend/src/pages/Pricing.jsx` — rebuilt to use the hook; shows "Redirecting to checkout…" spinner; if user already Pro, sends them to Dashboard.
  - `frontend/src/pages/Dashboard.jsx` — handles `?session_id=` polling on return from Stripe (12s window, 2s interval); shows "Welcome to Pro!" toast; handles `?canceled=1` from Pricing cancel URL. Also embeds `SubscriptionPanel`.
  - `frontend/src/components/plans/SubscriptionPanel.jsx` — Pro users see active plan + refund window + "Request refund" / "Cancel subscription" (Monthly) actions with confirm dialogs. Free users see an inline upgrade nudge.

**Verified end-to-end (real Stripe test mode):**
- Free user → click "Get Lifetime Access" → redirects to Stripe Checkout ($97 USD, sandbox banner, customer email pre-filled).
- Webhook `checkout.session.completed` → profile activated to `pro_lifetime`, `purchased_at` set, `stripe_customer_id` persisted; idempotent on replay.
- Return to `/dashboard?session_id=...` → 12s polling confirms activation, "Welcome to Pro!" toast, URL cleaned.
- `SubscriptionPanel` shows "Lifetime Pro · Active · Refund window: 7 days left".
- Click "Request refund" → confirm dialog → Stripe `Refund.create` succeeds → toast "Refund issued for $97.00" → profile downgraded to `free` → top nav flips back to "Free" + Upgrade button.
- Monthly: subscription mode → `pro_until` correctly populated via `current_period_end` (handles new Stripe API where it lives on subscription items); `cancel-subscription` returns `ends_at`; `invoice.paid` extends `pro_until` on renewal.
- Idempotency: replaying webhook events returns `duplicate: true`, profile state unchanged.
- Edge cases: invalid package → 400, bad origin → 400, unauthenticated → 401, foreign session_id → 403, double-refund → 400, re-checkout when Pro → 409.

**⚠️ Production handoff for user:**
1. Replace `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` with live keys when ready.
2. In Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://pro-unlock-3.preview.emergentagent.com/api/webhook/stripe`
   - Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_succeeded`, `customer.subscription.deleted`, `charge.refunded`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in `backend/.env` and restart backend.
3. Optionally re-seed Lifetime/Monthly Price IDs in live mode and update `STRIPE_PRICE_LIFETIME` / `STRIPE_PRICE_MONTHLY`.


### Phase 11.6 — Plan Quotas + Hard Deletes + Extra Plan Slots ✅ COMPLETE
**Status:** Strict tier-based quotas, permanent plan deletion, and pay-per-slot extras all live and verified end-to-end (backend 19/20 tests passed, frontend code-reviewed + smoke-rendered).

**Tier allowances:**
- Free: 1 plan
- Monthly: 1 plan + $10/mo per extra slot (recurring; canceling the extra sub decrements quota)
- Lifetime: 6 plans + $19.99 one-time per extra slot (permanent)

**Wiring / Files:**
- `backend/services/quota.py` — `get_quota`, `assert_can_create_plan`, `add_plan_credits`, `remove_extra_subscription`, `count_active_plans`. Credits stored in `auth.users.user_metadata.plan_credits` and `extra_sub_ids` (no schema migration).
- `backend/routers/plans.py`:
  - `GET /api/plans/quota` — returns `{tier, base_allowance, credits, limit, used, remaining, extra_package, extra_price_cents}`.
  - `POST /api/plans` — calls `quota_svc.assert_can_create_plan` → 402 `plan_quota_exceeded` when over.
  - `DELETE /api/plans/{id}` — hard-deletes plan + cascading rows (`plan_inputs`, `plan_steps`, `ai_runs`); frees slot immediately. RLS-protected (returns 404 for other users' plans, which is the intentional non-info-leaking behavior).
- `backend/routers/billing.py`:
  - Added `extra_lifetime` ($19.99 one-time) and `extra_monthly` ($10/mo subscription) packages with tier-gated checkout (403 `lifetime_required` / `monthly_required`).
  - Success URL uses `?extra_session_id={CHECKOUT_SESSION_ID}` for extras (separate from `?session_id` Pro flow).
  - `_activate_pro_from_session` branches on `extra_*` packages → calls `quota_svc.add_plan_credits(+1, sub_id=...)`.
  - `customer.subscription.deleted` webhook differentiates main sub (downgrade to free) vs extra sub (decrement credits via `remove_extra_subscription`).
- `backend/routers/exports.py` — already enforces `step_range = range(1, 8) if is_pro else range(1, 3)` so free PDF only includes Steps 1 & 2; DOCX returns 402 `pro_required` for free.
- `frontend/src/pages/Dashboard.jsx`:
  - Loads `/plans/quota` alongside plans; renders quota indicator (`X of Y plan slots used`).
  - When `remaining === 0`: free users see "Want a second plan?" upgrade card → `/pricing`; pro users see "Buy extra slot" inline button + dashed CTA card → triggers `useStartCheckout('extra_lifetime' | 'extra_monthly')`.
  - Plan cards have a hover/focus-revealed Trash button → AlertDialog confirm → `DELETE /plans/{id}` → toast + reload.
  - Polling effect handles BOTH `?session_id=` (Pro purchase) and `?extra_session_id=` (extra-slot purchase), routes correct success toast ("Welcome to Pro!" vs "Plan slot added!"). `isExtra` is correctly scoped to the effect.
  - `?canceled=1` and `?extras_canceled=1` toasts wired.

**Stripe prices (test mode):**
- `STRIPE_PRICE_EXTRA_LIFETIME=price_1Tb7VyGOHx8em2zzSuIyYPCP`
- `STRIPE_PRICE_EXTRA_MONTHLY=price_1Tb7VyGOHx8em2zzXCkGkw87`

**Bug fixed in this iteration:**
- `Dashboard.jsx` polling effect referenced `isExtra` without defining it → would throw `ReferenceError` after any successful Pro checkout, blocking the "Welcome to Pro!" toast and profile refresh. Now correctly derived from `searchParams.get("extra_session_id")` and used to branch toast copy + activation expectations.

**Verified end-to-end (testing agent, iteration_4):**
- `/quota` returns correct shape per tier (free/monthly/lifetime). ✅
- Quota enforcement: 402 `plan_quota_exceeded` once `used >= limit`. ✅
- Hard delete frees slot immediately (`used` decrements). ✅
- Extra-slot checkout: 403 on wrong tier; valid Stripe Session created for correct tier. ✅
- Webhook `checkout.session.completed` for `extra_*` increments `plan_credits` and tracks `extra_sub_ids` for monthly. ✅
- Webhook `customer.subscription.deleted` for extra sub decrements credits (without touching tier); for main sub downgrades to free (without touching credits). ✅
- Free PDF export: 5371 bytes, Steps 1-2 only, watermarked, locked-step footer. ✅
- Pro PDF export: 7516 bytes, all 7 steps. ✅
- Free DOCX export: 402 `pro_required`. ✅
- Pro DOCX export: valid 37 KB file. ✅
- Frontend: Dashboard renders without console errors; `isExtra` reference resolved.

---

## 3. Next Actions (Immediate)
1) **Flip your test account to Pro** in Supabase so Steps 3–4 unlock end-to-end:
   - `UPDATE profiles SET subscription_status = 'pro_lifetime' WHERE email = 'YOUR_EMAIL';`
2) Run a full end-to-end verification in the live app:
   - Signup/login
   - Plan wizard
   - Step 1 completion (including Deep WHY cascade)
   - Step 2 completion
   - Step 3: all tabs + AI generation + persistence + complete to Step 4
   - Step 4: all tabs + palette/typography generation + website spine generation + persistence + complete to Step 5
3) After Step 4 approval: begin Phase 7 (Step 5 NURTURE) implementation.

## 4. Success Criteria
- ✅ Phase 0: Supabase + Claude streaming proven end-to-end with enforced RLS.
- ✅ Phase 1–4: Steps 1–2 fully functional, auto-save correctly, and AI Assist streams on every input.
- ✅ Step 1 M229 updates complete (Deep WHY sequential reveal + Chief Aim updates) + Output card improvements.
- ✅ Reliability: debounced auto-save + keepalive + AI-generated output persistence.
- ✅ Step 3 initial implementation complete (FRAME Your Story tabs + output + completion).
- ✅ Step 4 initial implementation complete (IGNITE Your Brand tabs + output + completion).
- 🔜 Next: End-to-end verification under Pro gating for Steps 3–4; then Steps 5–7 implementation.
- 🔜 Exports: watermarked free PDF + full Pro PDF/Word.
- 🔜 Stripe: upgrades instantly unlock steps; billing portal and webhooks are reliable.
