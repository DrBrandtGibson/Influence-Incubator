# plan.md — The Influence Incubator Formula (Updated)

## 1. Objectives
- **Primary (now achieved for V1 free tier):** Prove core integrations end-to-end: **Supabase (Auth/DB/RLS/Storage)** + **FastAPI** + **Claude Sonnet 4.5** with **SSE-style streaming** and context-aware generation.
- **Ship V1 (Phases 1–4) as a polished free-tier product:** Landing + Auth + Dashboard + Plan Wizard + Plan Workspace + Step Navigator (locks) + **Steps 1–2 fully functional** with **Universal AI Assist on every field**.
- **Set up foundations for Pro:** Locked previews for Steps 3–7, subscription flag in `profiles`, exports and Stripe later.
- **Current objective (next):** **Pause for review** (user-requested checkpoint after Phases 1–4), then proceed to **Steps 3–7**, then **Exports**, then **Stripe**.

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

---

### Phase 2 — Supabase Schema + RLS + Wizard + Navigator + Universal AI Assist ✅ COMPLETE
**Delivered:**
1) **Supabase schema + RLS**
- Applied full schema (idempotent) supporting all phases:
  - `profiles`, `plans`, `plan_steps`, `plan_inputs`, `ai_runs`, plus step-specific tables (dream_customers, hero journey stages, story bank entries, etc.) and `stripe_events` (Phase 11).
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
- Auto-saves on blur to `plan_inputs`.

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
**Delivered Step 1 (6 tabs):**
1) **Identity**
- Business name input + “Generate 5 name options” (AI)
- Logo upload to **Supabase Storage** + “Generate 5 logo prompts” (AI)
- Business structure recommendation (AI)

2) **Driven, not Drifter**
- 5 verbatim questions with AI assist.

3) **MTP Discovery**
- 5 categories × 10 verbatim questions each (50 total).
- “Synthesize my MTP” → **8–10 word** MTP output (AI synthesize).

4) **7 Levels Deep WHY**
- Starter prompt + 7-level cascade + distilled one-sentence WHY.

5) **Chief Aim**
- 1-year / 3-year / 5-year horizons × 4 prompts (WHAT / GIVE / DATE / RESULTS).

6) **Your Output**
- Output card: Business Name, Logo, MTP, Deep WHY, 1-Year Aim (WHAT), Structure recommendation.
- “Complete Step 1” button marks `plan_steps.step_num=1` complete and advances.

---

### Phase 4 — Step 2 EXTRACT (Free, complete) + Celebration + Soft Upgrade ✅ COMPLETE
**Delivered Step 2 (6 tabs):**
1) **Maslow**
- Clickable pyramid-style UI; selections persisted.

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
- “Complete Step 2” marks step complete and shows **Celebration screen** with upgrade CTA.

**Pause point reached:** Phases 1–4 complete end-to-end; per user request, **pause for review** before building Steps 3–7.

---

### Phase 5–9 — Steps 3–7 (Pro) + Locked Previews (Free) 🔜 NEXT
**Current state:**
- Free users see locked previews / upgrade dialogs for steps 3–7.
- Pro experience is not yet implemented (coming next).

**Implementation approach (revised, realistic execution order):**
For each step 3–7:
1) Ensure **locked-preview** page is conversion-polished (already present via navigator locks; add per-step preview richness).
2) Build the **full Pro step implementation** with persistence, AI assist on every field, and step output cards.
3) Add step completion tracking + navigator status indicators.

**Step 3 — FRAME Your Story (Pro):**
- Brand Voice from prompts
- Story Bank builder
- Hero’s Journey 12-stage wheel × 2 journeys
- Hook-Story-Offer generator

**Step 4 — IGNITE Your Brand (Pro, largest):**
- Brand personality/archetypes
- Pocket Media Empire modules
- Website hub generator
- Two-track marketing plan
- 30/60/90 + Beyond content calendar

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

**Pro access control:**
- Continue using `profiles.subscription_status` (`free`, `pro_monthly`, `pro_lifetime`) + `pro_until`.
- Until Stripe Phase 11, enable a temporary admin toggle for internal testing.

---

### Phase 10 — Polish + Exports + Testing Hardening 🔜 UPCOMING
- **PDF export**
  - Free: Steps 1–2 only + watermark.
  - Pro: full plan clean PDF.
- **Word export** (docx): Pro only.
- Add onboarding tour, accessibility pass (WCAG AA), rate limiting.
- Increase test coverage (Playwright/Vitest) for critical flows.

---

### Phase 11 — Stripe Paywall (Deferred until Phase 10 done) 🔜 UPCOMING
- Pricing checkout for:
  - Lifetime $97
  - Monthly $19/mo
- Webhooks (idempotent via `stripe_events`) update `profiles.subscription_status`.
- Customer portal, refund policy page, guarantee messaging.

## 3. Next Actions (Immediate)
**We are at the user-requested checkpoint.**
1) User review of Phases 1–4 in the live app:
   - Landing + auth
   - Dashboard + wizard
   - Step 1 + Step 2 content + AI assist streaming
   - Locked-step behavior + upgrade dialog
2) Collect feedback on:
   - wording / flow / UI polish
   - which Pro step to prioritize first (Step 3 vs Step 4)
3) After approval: begin Phase 5 (Step 3 FRAME) implementation.

## 4. Success Criteria
- ✅ Phase 0: Supabase + Claude streaming proven end-to-end with enforced RLS.
- ✅ Phase 1–4: Steps 1–2 are fully functional, auto-save correctly, and AI Assist streams on every input.
- ✅ Free gating: 1 plan max + locks on steps 3–7 + upgrade dialog.
- ✅ UX: premium editorial brand feel; light/dark polished.
- 🔜 Next: Steps 3–7 reach spec-level depth for Pro.
- 🔜 Exports: watermarked free PDF + full Pro PDF/Word.
- 🔜 Stripe: upgrades instantly unlock steps; billing portal and webhooks are reliable.
