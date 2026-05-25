-- ============================================================
-- NewHere MVP — initial schema
-- ============================================================
-- Apply via Supabase SQL editor, or `supabase db push` if you
-- set up the CLI later. Safe to run on a fresh project.
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
create type social_energy as enum ('low', 'medium', 'high');
create type budget_tier   as enum ('low', 'medium', 'high');
create type task_category as enum ('community', 'hobby', 'routine', 'exploration');
create type task_status   as enum ('pending', 'done', 'snoozed', 'dismissed');

-- ------------------------------------------------------------
-- profiles — 1:1 with auth.users; holds onboarding answers
-- ------------------------------------------------------------
create table profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  city          text not null,
  move_date     date not null,
  social_energy social_energy not null default 'medium',
  has_car       boolean       not null default false,
  budget_tier   budget_tier   not null default 'medium',
  interests     text[]        not null default '{}',
  priorities    text[]        not null default '{}',
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

-- ------------------------------------------------------------
-- plans — saved 30-day plan; only one active per user
-- ------------------------------------------------------------
create table plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  version      int  not null default 1,
  is_active    boolean not null default true,
  generated_at timestamptz not null default now()
);

create index plans_user_id_idx on plans(user_id);
-- Enforce "one active plan per user" at the DB level
create unique index plans_one_active_per_user on plans(user_id) where is_active;

-- ------------------------------------------------------------
-- tasks — checklist items belonging to a plan
-- user_id is denormalized here so RLS can check ownership
-- without a join (much cheaper on every query).
-- ------------------------------------------------------------
create table tasks (
  id                    uuid primary key default gen_random_uuid(),
  plan_id               uuid not null references plans(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  category              task_category not null,
  title                 text not null,
  description           text,
  day_offset            int  not null check (day_offset between 0 and 29),
  link_url              text,
  status                task_status not null default 'pending',
  completed_at          timestamptz,
  order_index           int  not null default 0,
  -- Badge-relevant flags (drive "Showed Up" and "Regular" badges)
  is_event_attendance   boolean not null default false,
  is_recurring_activity boolean not null default false,
  created_at            timestamptz not null default now()
);

create index tasks_plan_id_idx        on tasks(plan_id);
create index tasks_user_id_idx        on tasks(user_id);
create index tasks_user_status_idx    on tasks(user_id, status);
create index tasks_plan_day_order_idx on tasks(plan_id, day_offset, order_index);

-- ------------------------------------------------------------
-- badges — global catalog (reference data, admin-managed)
-- ------------------------------------------------------------
create table badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text not null,
  icon        text,           -- emoji or icon identifier
  criteria    jsonb not null, -- e.g. {"type":"tasks_completed","count":5}
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- user_badges — which badges each user has earned
-- ------------------------------------------------------------
create table user_badges (
  user_id   uuid not null references auth.users(id) on delete cascade,
  badge_id  uuid not null references badges(id)     on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index user_badges_user_id_idx on user_badges(user_id);

-- ------------------------------------------------------------
-- updated_at trigger (profiles only — other tables are append-mostly)
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles     enable row level security;
alter table plans        enable row level security;
alter table tasks        enable row level security;
alter table badges       enable row level security;
alter table user_badges  enable row level security;

-- ---- profiles: owner-only ----
create policy profiles_select_own on profiles
  for select using (auth.uid() = user_id);

create policy profiles_insert_own on profiles
  for insert with check (auth.uid() = user_id);

create policy profiles_update_own on profiles
  for update using (auth.uid() = user_id)
             with check (auth.uid() = user_id);

-- ---- plans: owner-only ----
create policy plans_select_own on plans
  for select using (auth.uid() = user_id);

create policy plans_insert_own on plans
  for insert with check (auth.uid() = user_id);

create policy plans_update_own on plans
  for update using (auth.uid() = user_id)
             with check (auth.uid() = user_id);

create policy plans_delete_own on plans
  for delete using (auth.uid() = user_id);

-- ---- tasks: owner-only ----
create policy tasks_select_own on tasks
  for select using (auth.uid() = user_id);

create policy tasks_insert_own on tasks
  for insert with check (auth.uid() = user_id);

create policy tasks_update_own on tasks
  for update using (auth.uid() = user_id)
             with check (auth.uid() = user_id);

create policy tasks_delete_own on tasks
  for delete using (auth.uid() = user_id);

-- ---- badges: read-only for authenticated users ----
-- Writes happen via service role only (seed scripts / admin tools).
create policy badges_select_all on badges
  for select using (auth.role() = 'authenticated');

-- ---- user_badges: users can read their own ----
-- INSERT is intentionally NOT exposed to clients: granting a badge
-- must happen server-side (service role) after verifying criteria.
-- Otherwise a user could award themselves any badge.
create policy user_badges_select_own on user_badges
  for select using (auth.uid() = user_id);

-- ============================================================
-- Seed: a few starter badges (MVP)
-- ============================================================
insert into badges (slug, name, description, icon, criteria) values
  ('first_step', 'First Step', 'Complete your first task',                       '🌱', '{"type":"tasks_completed","count":1}'),
  ('momentum',   'Momentum',   'Complete 3 tasks',                               '⚡', '{"type":"tasks_completed","count":3}'),
  ('showed_up',  'Showed Up',  'Mark an event-attendance task complete',         '👋', '{"type":"event_attendance","count":1}'),
  ('regular',    'Regular',    'Complete 2 recurring-activity tasks',            '🔁', '{"type":"recurring_completed","count":2}'),
  ('newhere',    'NewHere',    'Complete 80% of your 30-day plan',               '🌳', '{"type":"completion_pct","pct":80}');
