-- ============================================================
-- NewHere — AI scaffolding (cache + audit log)
-- ============================================================
-- Purely additive on top of 0001. Safe to run repeatedly.
-- No drops, no enum changes — `if not exists` everywhere so
-- re-running is a no-op once the tables exist.
-- ============================================================

-- ------------------------------------------------------------
-- ai_suggestions — cache of generated content per user surface
-- ------------------------------------------------------------
-- One row = "the model's output for (user, surface, profile fingerprint)".
-- Fingerprint hashes the profile inputs that should invalidate the cache
-- (city + interests + goals + budget). If those don't change, the user
-- gets the cached suggestions on every page load with zero API cost.
-- Switching to a different surface (pre_move vs month_1) or editing the
-- profile produces a different fingerprint and a new row.
create table if not exists ai_suggestions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  surface       text not null,                  -- 'pre_move' | 'month_1' | ...
  profile_hash  text not null,                  -- fingerprint of inputs that affect output
  content       jsonb not null,                 -- AiSuggestion[]
  model         text not null,                  -- 'mock' | 'claude-haiku-4-5-20251001' | ...
  input_tokens  int  not null default 0,
  output_tokens int  not null default 0,
  search_count  int  not null default 0,
  generated_at  timestamptz not null default now()
);

create index if not exists ai_suggestions_user_surface_idx
  on ai_suggestions(user_id, surface);

-- Most recent row per (user, surface, fingerprint) is the "live" cache.
-- We don't unique-constrain so regenerating produces a new row (history).
create index if not exists ai_suggestions_lookup_idx
  on ai_suggestions(user_id, surface, profile_hash, generated_at desc);

-- ------------------------------------------------------------
-- ai_generations — append-only audit log of every model call
-- ------------------------------------------------------------
-- Recorded for every call regardless of cache hit (cache-hit rows record
-- 0 tokens). Drives per-user rate limiting and lets us see "how much have
-- I spent today" without leaving the app. estimated_cost_cents is a
-- denormalized convenience — calculated client-side from the config
-- token prices at call time, so historical rows stay accurate even if
-- pricing changes later.
create table if not exists ai_generations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  surface             text not null,
  model               text not null,
  cache_hit           boolean not null default false,
  input_tokens        int  not null default 0,
  output_tokens       int  not null default 0,
  search_count        int  not null default 0,
  estimated_cost_cents int not null default 0,    -- integer cents (e.g. 7 = $0.07)
  succeeded           boolean not null default true,
  error_message       text,
  created_at          timestamptz not null default now()
);

create index if not exists ai_generations_user_created_idx
  on ai_generations(user_id, created_at desc);

-- ============================================================
-- RLS — same owner-only model as the rest of the app
-- ============================================================
alter table ai_suggestions enable row level security;
alter table ai_generations enable row level security;

-- ai_suggestions: read own. Writes happen server-side (service role
-- bypasses RLS), so no client INSERT policy.
drop policy if exists ai_suggestions_select_own on ai_suggestions;
create policy ai_suggestions_select_own on ai_suggestions
  for select using (auth.uid() = user_id);

-- ai_generations: read own. Writes server-side only.
drop policy if exists ai_generations_select_own on ai_generations;
create policy ai_generations_select_own on ai_generations
  for select using (auth.uid() = user_id);

-- ============================================================
-- Grants — match the pattern in 0001
-- ============================================================
grant select on public.ai_suggestions to authenticated;
grant select on public.ai_generations to authenticated;
grant all    on public.ai_suggestions, public.ai_generations to service_role;
