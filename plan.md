# plan.md — The Influence Incubator Formula

## 1. Objectives
- Prove core integrations: **Supabase (Auth/DB/RLS/Storage)** + **FastAPI SSE** + **Claude Sonnet 4.5 streaming**.
- Ship V1 (Phases 1–4): landing + auth + dashboard + plan wizard + step navigator (locks) + **Step 1–2 fully functional free tier** with universal AI Assist.
- Establish foundations for pro gating, exports, and later Stripe (deferred).

## 2. Implementation Steps

### Phase 0 — Core POC (Isolation; do not proceed until stable)
**Core workflow to prove:** React ↔ Supabase Auth session/JWT ↔ FastAPI verifies user ↔ FastAPI streams Claude SSE ↔ writes/reads plan context from Supabase with RLS.

1) Websearch quick playbook
- Confirm best practices for: Supabase JWT verification in FastAPI, Supabase RLS patterns (user_id), SSE streaming in FastAPI + fetch/EventSource in React.

2) Minimal Python POC scripts (run locally in backend env)
- `poc_supabase_admin.py`: connect via service role; create/read a test table row; confirm storage bucket create/upload/list.
- `poc_supabase_rls.sql`: create tiny `plans` table + RLS; test `select/insert` as anon/authenticated (use JWT) to ensure isolation works.
- `poc_claude_stream.py`: call Emergent LLM (Claude Sonnet 4.5) and stream tokens; assert chunked output.

3) Minimal FastAPI POC endpoints
- `GET /api/health`.
- `POST /api/poc/ai-stream` (SSE): returns streamed tokens from Claude.
- `GET /api/poc/me` verifies Supabase JWT (Authorization: Bearer) and returns user id/email.

4) Minimal React POC page
- Login via Supabase email/password; call `/api/poc/me`; call `/api/poc/ai-stream` and render live stream.

**Phase 0 user stories (test each):**
1. As a user, I can sign up with email/password and receive a verification email.
2. As a user, I can log in and maintain a session in the browser.
3. As a logged-in user, I can call a protected backend endpoint and see my user id.
4. As a user, I can click “Test AI Stream” and watch tokens appear live.
5. As a user, my test plan row is only visible to me (RLS verified).

**Exit criteria:** streaming works reliably; JWT verification works; RLS blocks cross-user reads/writes.

---

### Phase 1 — Foundation + Brand UI + Auth + Landing (V1 shell)
1) Frontend foundation (React/Vite)
- Brand tokens (colors, typography EB Garamond/Inter), light/dark themes.
- Layout: top nav + footer; app shell scaffolding.

2) Landing page (/)
- Cinematic hero, diagonal dividers, 7-step preview cards with FREE/PRO badges, CTA “Start Your Plan — Free”, attribution.

3) Auth routes
- `/signup`, `/login`, `/forgot-password` using Supabase Auth.
- Route guards for `/dashboard` and `/plans/*`.

4) Backend
- Keep only: auth verification helper + health endpoint; no business logic yet.

**Phase 1 user stories:**
1. As a visitor, I can understand the 7-step framework and what’s free vs pro from the landing page.
2. As a user, I can sign up, verify my email, and log in.
3. As a user, I can request a password reset email and set a new password.
4. As a user, I’m redirected away from protected pages when logged out.
5. As a user, I can log out and my session is cleared.

End of phase: run 1 E2E smoke (Playwright): landing → signup/login → dashboard protected.

---

### Phase 2 — Supabase Schema + RLS + Wizard + Navigator + Universal AI Assist
1) Supabase DB (SQL migrations)
- Tables (minimum for Phases 1–4): `profiles`, `plans`, `plan_steps`, `plan_inputs`, `ai_runs`.
- RLS: user can only access own rows; helper views if needed.

2) Dashboard (/dashboard)
- List plans; create plan CTA.
- Enforce free=1 plan limit (server-verified + UI messaging).

3) Plan creation wizard (/plans/new)
- Capture: idea, optional name, founder backstory, industry, stage.
- Create plan + initialize step records.

4) Workspace + Navigator
- `/plans/:id/:step` route.
- Left sidebar 7 steps + lock icons for steps 3–7 when free.
- Locked click opens upgrade modal; unlocked allows jump.

5) Universal `<AIAssistInput>`
- Wrap inputs; floating toolbar buttons: Answer, Expand, Refine.
- Sends full plan context (wizard + prior step answers) to backend.

6) AI endpoints (FastAPI, all under `/api/ai/*`, SSE where needed)
- `/api/ai/answer-question` (SSE)
- `/api/ai/expand-answer` (SSE)
- `/api/ai/refine` (SSE, with short chat turns)
- Persist `ai_runs` + associate with field.

**Phase 2 user stories:**
1. As a free user, I can create my first plan but I’m blocked from creating a second.
2. As a user, I can open a plan workspace and see the 7-step navigator.
3. As a free user, I see gold locks on steps 3–7 and a clear upgrade prompt when clicking.
4. As a user, I can click “Answer for me” on any field and see a streamed answer.
5. As a user, I can refine a draft (“shorter/more specific”) without losing my original text.

End of phase: 1 E2E: signup → wizard → workspace → AI assist stream → lock behavior.

---

### Phase 3 — Step 1 DEFINE (Free, complete)
Implement Step 1 screens + persistence to `plan_inputs` with structured keys.
- Business Identity: name gen (5 + rationale), logo upload to Supabase Storage + prompt generator, structure recommendation.
- Driven Not Drifter: 5 verbatim questions.
- MTP Discovery: all question sets + AI synthesis to 8–10 word MTP.
- 7 Levels Deep WHY: interactive cascade.
- Definite Chief Aim: 1yr/3yr/5yr prompts.
- Output card: editable + regenerate sections.

**Phase 3 user stories:**
1. As a user, I can answer all Step 1 questions and my progress is saved automatically.
2. As a user, I can generate 5 business names with reasons and pick one.
3. As a user, I can upload a logo and see it stored/retrieved from Supabase Storage.
4. As a user, I can run the MTP synthesis and get a concise MTP line.
5. As a user, I can view a single Step 1 output card and edit any section.

End of phase: 1 E2E: complete Step 1 with AI assist + refresh persistence.

---

### Phase 4 — Step 2 EXTRACT (Free, complete) + Celebration + Soft Upgrade
- Maslow interactive (clickable SVG) + selection stored.
- Robbins 6-Needs wheel selection (3+ needs).
- Niche selector (10 verbatim Qs) → AI micro-niche statement.
- Demographics (11 Qs) + AI suggested values.
- Psychographics (11 Qs) with heavy AI generation.
- Dream Customer Trading Card: generate printable PNG.
- End-of-step celebration screen + soft upgrade prompt.

**Phase 4 user stories:**
1. As a user, I can select Maslow level and see it reflected in my audience summary.
2. As a user, I can pick 3+ Robbins needs and get an AI explanation of the fit.
3. As a user, I can generate a micro-niche statement from my niche answers.
4. As a user, I can generate a Dream Customer trading card image and download it.
5. As a free user, after completing Step 2 I see a celebration screen and a non-blocking upgrade prompt.

End of phase: 1 E2E: wizard → Step1 → Step2 → generate card → celebration; then **PAUSE for review**.

---

### Phase 5–9 — Steps 3–7 (Pro) + Locked Previews (Free)
- For each step: build locked-preview page first (conversion-focused), then full pro implementation.
- Add `hasProAccess()` hook (stubbed until Stripe) using a `profiles.plan_tier` flag set manually for testing.
- Persist all step inputs to Supabase; reuse `<AIAssistInput>` everywhere.

**Phase 5–9 user stories (minimum to validate):**
1. As a free user, I can view a beautiful preview of Step 3–7 but cannot edit them.
2. As a pro (test-flag) user, I can complete Step 3 and see outputs saved.
3. As a pro user, I can complete Step 4 and generate the marketing plan sections.
4. As a pro user, I can complete Step 5–7 and see a coherent end-to-end plan.
5. As any user, the navigator accurately shows completed/incomplete status per step.

End of each step: E2E for that step’s happy path.

---

### Phase 10 — Polish + Exports + Testing Hardening
- PDF export: free = Steps 1–2 watermarked; pro = full clean PDF.
- Word export (docx): pro only.
- Add onboarding tour, accessibility pass, rate limiting + AI output sanitization.
- Tests: Vitest critical units + Playwright core flows.

**Phase 10 user stories:**
1. As a free user, I can export a watermarked PDF containing only Steps 1–2.
2. As a pro user, I can export a clean full PDF of all steps.
3. As a pro user, I can export a Word document.
4. As a user, I can resume where I left off with accurate saved progress.
5. As a user, the UI works on desktop and remains usable on mobile.

---

### Phase 11 — Stripe Paywall (Deferred until Phase 10 done)
- Pricing page, checkout sessions (lifetime + subscription), webhooks → update `profiles.plan_tier`.
- Customer portal, refund policy page, idempotent `stripe_events`.

**Phase 11 user stories:**
1. As a user, I can upgrade to Pro and immediately unlock Steps 3–7.
2. As a user, I can manage/cancel my subscription in the billing portal.
3. As a user, webhook processing is reliable (no double-processing).
4. As a user, I can purchase lifetime access and retain Pro status.
5. As a user, I can request a refund per the policy and lose access if refunded.

## 3. Next Actions (Immediate)
1. Implement Phase 0 scripts + endpoints + single React POC page.
2. Run POC tests until: Auth JWT verification + RLS + SSE streaming are stable.
3. Only then start Phase 1 UI build.

## 4. Success Criteria
- Phase 0: Supabase + Claude SSE streaming proven end-to-end with real tokens and enforced RLS.
- Phase 1–4: Steps 1–2 are fully functional, persist reliably, and AI Assist works on every input.
- Free gating: 1 plan max + locks on steps 3–7 behave correctly.
- UX: landing/auth/dashboard/wizard/workspace flows are smooth and branded.
- Regression safety: Playwright covers critical user flows; exports work in Phase 10.