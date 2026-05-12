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

### Phase 10 — Polish + Exports + Testing Hardening 🔜 UPCOMING
- PDF export
  - Free: Steps 1–2 only + watermark.
  - Pro: full plan clean PDF.
- Word export (docx): Pro only.
- Add onboarding tour, accessibility pass (WCAG AA), rate limiting.
- Increase test coverage (Playwright/Vitest) for critical flows.
- Add regression checks for persistence (debounced saves + AI output persistence).

---

### Phase 11 — Stripe Paywall (Deferred until Phase 10 done) 🔜 UPCOMING
- Pricing checkout for:
  - Lifetime $97
  - Monthly $19/mo
- Webhooks (idempotent via `stripe_events`) update `profiles.subscription_status`.
- Customer portal, refund policy page, guarantee messaging.

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
