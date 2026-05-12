# plan.md — The Influence Incubator Formula (Updated)

## 1. Objectives
- **Primary (achieved for V1 free tier):** Prove core integrations end-to-end: **Supabase (Auth/DB/RLS/Storage)** + **FastAPI** + **Claude Sonnet 4.5** with **SSE-style streaming** and context-aware generation.
- **Ship V1 (Phases 1–4) as a polished free-tier product:** Landing + Auth + Dashboard + Plan Wizard + Plan Workspace + Step Navigator (locks) + **Steps 1–2 fully functional** with **Universal AI Assist on every field**.
- **Strengthen reliability (in progress / hardening completed for key flows):** Ensure **all user inputs + AI-generated outputs persist reliably** across rapid navigation and refresh (debounced saves + keepalive + persistence of synthesized outputs).
- **Ship first Pro step end-to-end:** Deliver **Step 3 (FRAME Your Story)** with consistent UX patterns (tabs, AI assist, synthesis panels, output card, completion).
- **Current objective (next):** **End-to-end verify Step 3 in live UI (Pro account)** and then proceed to **Step 4–7**, followed by **Exports**, then **Stripe**.

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
- **Persistence hardening (see Phase 3 “Reliability fixes” + Phase 5 carry-over):** supports debounced auto-save on change (not just blur).

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
- **Starter prompt pre-seeded from synthesized MTP** (editable)
- **Sequential reveal:** all 7 levels hidden until user clicks Next
- Each Next generates a **short single-sentence WHY question** synthesized by AI from the previous answer
- **Progression blocked**: Next disabled until the current level has an answer
- Level 7 displayed as the **Big Why** in a dark cinematic panel

6) **Chief Aim (Message 229 refinements)**
- Displays synthesized MTP as **read-only banner** at top
- Adds Brandt Gibson quote
- Horizons include **3-Month / 1-Year / 3-Year / 5-Year**
- Each horizon uses the same set of subfields: **WHAT / GIVE / DATE / RESULTS** with AI assist

7) **Your Output (updated)**
- Header updated: **“DEFINE Your Purpose Card”**
- Output card includes: Business Name, Logo, Purpose, MTP, Deep WHY
- **Chief Aim (WHAT) shows all 4 horizons** (3-Month, 1-Year, 3-Year, 5-Year) in a clean 2×2 grid
- “Complete Step 1” marks `plan_steps.step_num=1` complete and advances

**Reliability fixes (persistence hardening) ✅ COMPLETE**
- Added `keepalive: true` to `/api/plans/{id}/inputs` persists.
- Wired `usePersistedField` inside `AIAssistInput` so **every keystroke** is debounced-auto-saved.
- Updated `streamingGenerate` helper(s) to **auto-persist AI-generated values** to `plan_inputs` so they survive refresh.
- Output card reads `why_level_7` directly with `deep_why` as fallback.

---

### Phase 4 — Step 2 EXTRACT (Free, complete) + Celebration + Soft Upgrade ✅ COMPLETE
**Delivered Step 2 (6 tabs):**
1) **Maslow**
- Clickable pyramid-style UI; selections persisted.
- **Hit-zone alignment tuning completed** in `MaslowImagePyramid.jsx` to match the artwork.
  - Current tier bounds:
    - Self-Actualization: **4–44%**
    - Esteem: **44–58%**
    - Love & Belonging: **58–72%**
    - Safety & Security: **72–85%**
    - Physiological: **85–99%**

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

---

### Phase 5 — Step 3 FRAME Your Story (Pro) ✅ INITIAL IMPLEMENTATION COMPLETE
**Status:** Step 3 core experience implemented and wired into the workspace; ready for end-to-end verification.

**Wiring / Files:**
- Added Step 3 constants and copy to: `frontend/src/lib/framework.js`
- Created Step 3 UI: `frontend/src/components/steps/StepFrame.jsx`
- Routed in workspace: `frontend/src/pages/PlanWorkspace.jsx` now renders Step 3 at `/plans/:id/frame`

**Access / Pro gating:**
- Step 3 remains Pro-gated through existing app logic.
- Backend `access.can_access_step` enforces **403** on AI endpoints for step 3+ if user is not Pro.
- Development preview approach chosen: **flip your test account** in Supabase:
  - `profiles.subscription_status = 'pro_lifetime'`

**Delivered Step 3 (6 sub-tabs):**
1) **Brand Voice**
- 10 verbatim prompts with AI Assist.
- Seth Godin quote.
- “Synthesize my Brand Voice” → 3-part profile:
  - Part 1: Voice in one line
  - Part 2: 4-sentence profile
  - Part 3: We say / We don’t say (4 items each)

2) **Story Bank**
- 9 expandable categories (user-provided):
  - Early Life
  - Difficulties
  - Embarrassing Moments
  - Previous Failures
  - Your Successes
  - New Approach
  - Misconceptions
  - Transformation
  - Bragging Rights
- Each category uses AI Assist and encourages raw capture.

3) **Hero’s Journey**
- 12 classical Campbell stages.
- Interactive SVG wheel with gold highlights for drafted segments.
- Persona toggle via tabs/switch:
  - Founder’s Journey (fields suffixed `__founder`)
  - Customer’s Journey (fields suffixed `__customer`)

4) **Hook · Story · Offer**
- AI “Generate HSO bundle” using Brand Voice + Story Bank + Founder Journey context.
- Individual refinement fields for Hook, Story, Offer.

5) **Important Stories (Distillation)**
- Transformation Promise (1 line) — verbatim helper:
  - “Identify the transformation you wanted and what it looked like with this new solution.”
- 200-word Elevator Pitch with AI Synthesize.

6) **Your Output**
- “FRAME Your Story Card” summary:
  - Promise
  - Voice
  - Hook/Story/Offer (or bundle)
  - Elevator pitch
  - Coverage stats: Story Bank X/9, Founder X/12, Customer X/12
- “Complete Step 3” advances to Step 4.

**Notes:**
- Lint clean; frontend compiles.
- Persistence is handled by global `AIAssistInput` debounced saving plus Step 3’s streaming generate persistence.

**Exit criteria for Phase 5 (still pending):**
- End-to-end UI verification (Pro account): navigation, AI generation, persistence on refresh, completion.

---

### Phase 6–9 — Steps 4–7 (Pro) + Locked Previews (Free) 🔜 NEXT
**Current state:**
- Free users see locked previews / upgrade dialogs for steps 3–7.
- Step 3 is now implemented; steps 4–7 remain Coming Soon / preview.

**Implementation approach:**
For each step 4–7:
1) Ensure locked-preview page is conversion-polished.
2) Build full Pro step implementation with persistence, AI assist, and an output card.
3) Add step completion tracking + navigator status indicators.

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
1) **Flip your test account to Pro** in Supabase so Step 3 unlocks:
   - `UPDATE profiles SET subscription_status = 'pro_lifetime' WHERE email = 'YOUR_EMAIL';`
   - (Or match by `id` if preferred.)
2) Run a full end-to-end verification in the live app:
   - Signup/login
   - Plan wizard
   - Step 1 completion (including Deep WHY cascade)
   - Step 2 completion
   - **Step 3**:
     - Brand Voice synthesize
     - Story Bank entries
     - Hero’s Journey (founder + customer)
     - Generate HSO bundle
     - Synthesize elevator pitch
     - Confirm persistence on refresh
     - Complete Step 3 → Step 4
3) After Step 3 approval: begin Phase 6 (Step 4 IGNITE) implementation.

## 4. Success Criteria
- ✅ Phase 0: Supabase + Claude streaming proven end-to-end with enforced RLS.
- ✅ Phase 1–4: Steps 1–2 fully functional, auto-save correctly, and AI Assist streams on every input.
- ✅ Step 1 M229 updates complete (Deep WHY sequential reveal + Chief Aim updates) + Output card improvements.
- ✅ Reliability: debounced auto-save + keepalive + AI-generated output persistence.
- ✅ Step 3 initial implementation complete (FRAME Your Story tabs + output + completion).
- 🔜 Next: Step 3 end-to-end verification under Pro gating; then Steps 4–7 reach spec-level depth for Pro.
- 🔜 Exports: watermarked free PDF + full Pro PDF/Word.
- 🔜 Stripe: upgrades instantly unlock steps; billing portal and webhooks are reliable.
