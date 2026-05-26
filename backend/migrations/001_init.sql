-- ============================================================
-- The Influence Incubator Formula — Full schema (idempotent)
-- Run this ONCE in your Supabase SQL Editor:
--   https://supabase.com/dashboard/project/dhxkwacdzmwwnmokmppf/sql/new
-- ============================================================

create extension if not exists "pgcrypto";

-- ================== PROFILES ==================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  subscription_status text not null default 'free' check (subscription_status in ('free','pro_monthly','pro_lifetime','pro_lifetime_unlimited')),
  stripe_customer_id text,
  stripe_subscription_id text,
  pro_until timestamptz,
  purchased_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile row on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================== PLANS ==================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  idea text,
  founder_backstory text,
  industry text,
  stage text,
  current_step int not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.plans enable row level security;
drop policy if exists "plans_all_own" on public.plans;
create policy "plans_all_own" on public.plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists plans_user_idx on public.plans(user_id);

-- ================== PLAN_STEPS (per-step status & summary) ==================
create table if not exists public.plan_steps (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  step_num int not null check (step_num between 1 and 7),
  status text not null default 'not_started' check (status in ('not_started','in_progress','complete')),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique (plan_id, step_num)
);
alter table public.plan_steps enable row level security;
drop policy if exists "plan_steps_all_own" on public.plan_steps;
create policy "plan_steps_all_own" on public.plan_steps for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));
create index if not exists plan_steps_plan_idx on public.plan_steps(plan_id);

-- ================== PLAN_INPUTS (per-field freeform storage) ==================
create table if not exists public.plan_inputs (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  step_num int not null check (step_num between 1 and 7),
  field_key text not null,
  value text,
  meta jsonb default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique (plan_id, step_num, field_key)
);
alter table public.plan_inputs enable row level security;
drop policy if exists "plan_inputs_all_own" on public.plan_inputs;
create policy "plan_inputs_all_own" on public.plan_inputs for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));
create index if not exists plan_inputs_plan_idx on public.plan_inputs(plan_id, step_num);

-- ================== AI_RUNS (history of AI generations) ==================
create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  step_num int,
  field_key text,
  mode text check (mode in ('answer','expand','refine','generate','synthesize')),
  prompt text,
  response text,
  tokens int,
  created_at timestamptz default now()
);
alter table public.ai_runs enable row level security;
drop policy if exists "ai_runs_all_own" on public.ai_runs;
create policy "ai_runs_all_own" on public.ai_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists ai_runs_plan_idx on public.ai_runs(plan_id);

-- ================== STEP-SPECIFIC CHILD TABLES ==================

-- Step 2: dream_customers (Trading Card)
create table if not exists public.dream_customers (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  name text,
  photo_url text,
  niche_label text,
  demographics jsonb default '{}'::jsonb,
  psychographics jsonb default '{}'::jsonb,
  maslow_levels jsonb default '[]'::jsonb,
  robbins_needs jsonb default '[]'::jsonb,
  micro_niche_statement text,
  card_image_url text,
  created_at timestamptz default now()
);
alter table public.dream_customers enable row level security;
drop policy if exists "dream_customers_all_own" on public.dream_customers;
create policy "dream_customers_all_own" on public.dream_customers for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Step 3: heros_journey_stages
create table if not exists public.heros_journey_stages (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  journey_type text not null check (journey_type in ('founder','business')),
  stage_num int not null check (stage_num between 1 and 12),
  stage_name text,
  responses jsonb default '{}'::jsonb,
  draft text,
  unique (plan_id, journey_type, stage_num)
);
alter table public.heros_journey_stages enable row level security;
drop policy if exists "hjs_all_own" on public.heros_journey_stages;
create policy "hjs_all_own" on public.heros_journey_stages for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Step 3: story_bank_entries
create table if not exists public.story_bank_entries (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  prompt_index int,
  prompt text,
  response text,
  tags text[],
  created_at timestamptz default now()
);
alter table public.story_bank_entries enable row level security;
drop policy if exists "sbe_all_own" on public.story_bank_entries;
create policy "sbe_all_own" on public.story_bank_entries for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Step 5: transformative_frameworks
create table if not exists public.transformative_frameworks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  framework_name text,
  origin text,
  epiphany text,
  elixir text,
  steps jsonb default '[]'::jsonb,
  diagram_url text,
  created_at timestamptz default now()
);
alter table public.transformative_frameworks enable row level security;
drop policy if exists "tf_all_own" on public.transformative_frameworks;
create policy "tf_all_own" on public.transformative_frameworks for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Step 5: saas_opportunities
create table if not exists public.saas_opportunities (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  idea_name text,
  features jsonb default '[]'::jsonb,
  monetization text,
  created_at timestamptz default now()
);
alter table public.saas_opportunities enable row level security;
drop policy if exists "saas_all_own" on public.saas_opportunities;
create policy "saas_all_own" on public.saas_opportunities for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Step 6: dream_100_contacts
create table if not exists public.dream_100_contacts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  name text,
  tier text check (tier in ('A','B','C')),
  channel text,
  notes text,
  status text default 'new',
  created_at timestamptz default now()
);
alter table public.dream_100_contacts enable row level security;
drop policy if exists "d100_all_own" on public.dream_100_contacts;
create policy "d100_all_own" on public.dream_100_contacts for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Step 4 / 6: content_calendar_items
create table if not exists public.content_calendar_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  day_num int,
  phase text check (phase in ('foundation','momentum','scale','beyond')),
  channel text,
  title text,
  body text,
  hashtags text[],
  scheduled_for date,
  created_at timestamptz default now()
);
alter table public.content_calendar_items enable row level security;
drop policy if exists "cci_all_own" on public.content_calendar_items;
create policy "cci_all_own" on public.content_calendar_items for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Step 6: book_outlines
create table if not exists public.book_outlines (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  format text,
  title text,
  outline jsonb default '{}'::jsonb,
  timeline jsonb default '{}'::jsonb,
  kdp_checklist jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
alter table public.book_outlines enable row level security;
drop policy if exists "bo_all_own" on public.book_outlines;
create policy "bo_all_own" on public.book_outlines for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Step 7: service_sops
create table if not exists public.service_sops (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  sop_type text,
  content jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table public.service_sops enable row level security;
drop policy if exists "sops_all_own" on public.service_sops;
create policy "sops_all_own" on public.service_sops for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Generic todos
create table if not exists public.todo_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  title text,
  done boolean default false,
  created_at timestamptz default now()
);
alter table public.todo_items enable row level security;
drop policy if exists "todo_all_own" on public.todo_items;
create policy "todo_all_own" on public.todo_items for all
  using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Stripe webhook idempotency (for Phase 11)
create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  type text,
  payload jsonb,
  processed_at timestamptz default now()
);
alter table public.stripe_events enable row level security;
-- Only service role accesses this table; deny all anon access
drop policy if exists "stripe_events_no_access" on public.stripe_events;
create policy "stripe_events_no_access" on public.stripe_events for all using (false) with check (false);

-- ================== POC TABLE (Phase 0 only) ==================
create table if not exists public.iif_poc_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz default now()
);
alter table public.iif_poc_plans enable row level security;
drop policy if exists "select_own" on public.iif_poc_plans;
drop policy if exists "insert_own" on public.iif_poc_plans;
create policy "select_own" on public.iif_poc_plans for select using (auth.uid() = user_id);
create policy "insert_own" on public.iif_poc_plans for insert with check (auth.uid() = user_id);

-- ================== STORAGE BUCKET ==================
-- Bucket 'iif-logos' is created via the supabase-py SDK from the POC; no SQL needed.
-- If you want logo uploads to be private, change to public=false and add storage policies.

-- ================== DONE ==================
-- All set. Re-run /app/backend/test_core.py to verify everything works.
