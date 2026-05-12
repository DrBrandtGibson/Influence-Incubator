# plan.md — The Influence Incubator Formula (Updated)

## 1. Objectives
- **Primary (achieved for V1 free tier):** Prove core integrations end-to-end: **Supabase (Auth/DB/RLS/Storage)** + **FastAPI** + **Claude Sonnet 4.5** with **SSE-style streaming** and context-aware generation.
- **Ship V1 (Phases 1–4) as a polished free-tier product:** Landing + Auth + Dashboard + Plan Wizard + Plan Workspace + Step Navigator (locks) + **Steps 1–2 fully functional** with **Universal AI Assist on every field**.
- **Strengthen reliability:** Ensure **all user inputs + AI-generated outputs persist reliably** across rapid navigation and refresh (debounced saves + keepalive + persistence of synthesized outputs).
- **Set up foundations for Pro:** Locked previews for Steps 3–7, subscription flag in `profiles`, exports and Stripe later.
- **Current objective (next):** Finish **end-to-end verification** of the Step 1 DEFINE refinements + persistence hardening, then proceed to **Steps 3–7**, then **Exports**, then **Stripe**.

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
- **Persistence hardening (added later; see Phase 3 “Reliability fixes”):** now supports debounced auto-save on change (not just blur).

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
- 5 categories × 10 verbatim questions each (50 total).
- “Synthesize my MTP” → **8–10 word** MTP output (AI synthesize).
- Educational popups: Kotler, key aspects, examples, Churchill quote.

5) **7 Levels Deep WHY (Message 229 refinements)**
- **Starter prompt pre-seeded from synthesized MTP** (editable).
- **Sequential reveal:** all 7 levels hidden until user clicks Next.
- Each Next generates a **short single-sentence WHY question** synthesized by AI from the previous answer.
- **Progression blocked**: Next disabled until the current level has an answer.
- Level 7 displayed as the **Big Why** in a dark cinematic panel.

6) **Chief Aim (Message 229 refinements)**
- Displays synthesized MTP as **read-only banner** at top.
- Adds Brandt Gibson quote: “The most effective method…”
- Horizons include **3-Month / 1-Year / 3-Year / 5-Year**.
- Each horizon uses the same set of subfields: **WHAT / GIVE / DATE / RESULTS** with AI assist.

7) **Your Output (updated)**
- Header updated: **“DEFINE Your Purpose Card”** (was “Your Step 1 plan card”).
- Output card includes: Business Name, Logo, Purpose, MTP, Deep WHY.
- **Chief Aim (WHAT) now shows all 4 horizons** (3-Month, 1-Year, 3-Year, 5-Year) in a clean 2×2 grid.
- “Complete Step 1” marks `plan_steps.step_num=1` complete and advances.

**Reliability fixes (persistence hardening) ✅ COMPLETE**
- Added `keepalive: true` to all `/api/plans/{id}/inputs` persist calls (survives navigation/unmount).
- Wired `usePersistedField` inside `AIAssistInput` so **every keystroke** is debounced-auto-saved (no longer relies solely on `onBlur`, which caused `ERR_ABORTED`).
- Updated `streamingGenerate` helper to **auto-persist AI-generated values** to `plan_inputs` so they survive refresh (e.g., `mtp_statement`, `why_question_*`, `purpose_statement`, `business_names`, `logo_prompts`, `structure_recommendation`).
- Output card reads `why_level_7` directly with `deep_why` as fallback (avoids duplicate state bugs).

**Status note:** Feature-complete; pending a clean end-to-end UI verification pass after persistence changes.

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
1) Ensure **locked-preview** page is conversion-polished.
2) Build the **full Pro step implementation** with persistence, AI assist on every field, and step output cards.
3) Add step completion tracking + navigator status indicators.

**Step 3 — FRAME Your Story (Pro):**
- Brand Voice from prompts
- Story Bank builder
- Hero’s Journey 12-stage wheel × 2 journeys
- Hook-Story-Offer generator
- Important Stories distillation

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
- Add regression checks for persistence (debounced saves + AI output persistence).

---

### Phase 11 — Stripe Paywall (Deferred until Phase 10 done) 🔜 UPCOMING
- Pricing checkout for:
  - Lifetime $97
  - Monthly $19/mo
- Webhooks (idempotent via `stripe_events`) update `profiles.subscription_status`.
- Customer portal, refund policy page, guarantee messaging.

## 3. Next Actions (Immediate)
**We are at the user-requested checkpoint.**
1) Run a full end-to-end verification in the live app:
   - Signup/login
   - Plan wizard
   - Step 1: MTP synthesis → 7 Levels Deep WHY cascade (levels 1–7) → confirm Big Why shows
   - Confirm AI-generated questions and synthesized artifacts persist on refresh
   - Confirm Chief Aim horizons persist + show correctly in Output card
   - Step 2 completion + celebration screen
2) Collect feedback on:
   - wording / flow / UI polish
   - which Pro step to prioritize first (Step 3 vs Step 4)
3) After approval: begin Phase 5 (Step 3 FRAME) implementation.

## 4. Success Criteria
- ✅ Phase 0: Supabase + Claude streaming proven end-to-end with enforced RLS.
- ✅ Phase 1–4: Steps 1–2 are fully functional, auto-save correctly, and AI Assist streams on every input.
- ✅ Free gating: 1 plan max + locks on steps 3–7 + upgrade dialog.
- ✅ Phase 3 refinements: Deep WHY sequential reveal + Chief Aim updates + improved Output card.
- ✅ Reliability: debounced auto-save + keepalive + AI-generated output persistence.
- 🔜 Next: Steps 3–7 reach spec-level depth for Pro.
- 🔜 Exports: watermarked free PDF + full Pro PDF/Word.
- 🔜 Stripe: upgrades instantly unlock steps; billing portal and webhooks are reliable.
