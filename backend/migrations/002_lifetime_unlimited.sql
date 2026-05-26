-- ============================================================
-- Phase 11.7 — Add `pro_lifetime_unlimited` tier
-- Run this in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/dhxkwacdzmwwnmokmppf/sql/new
--
-- Safe to run multiple times — re-applies the new CHECK constraint
-- on profiles.subscription_status.
-- ============================================================

alter table public.profiles
  drop constraint if exists profiles_subscription_status_check;

alter table public.profiles
  add constraint profiles_subscription_status_check
  check (subscription_status in (
    'free',
    'pro_monthly',
    'pro_lifetime',
    'pro_lifetime_unlimited'
  ));
