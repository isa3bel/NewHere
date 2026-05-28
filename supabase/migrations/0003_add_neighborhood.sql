-- ============================================================
-- Add optional neighborhood to profiles
-- ============================================================
-- Powers hyper-local suggestions (grocery stores, daily shops) in
-- the Week 1 AI overlay. Nullable + no default — users who skip
-- it just get city-level suggestions.
-- ============================================================

alter table profiles
  add column if not exists neighborhood text;
