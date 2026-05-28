-- ============================================================
-- Feedback table — bug reports + suggestions from users
-- ============================================================
-- Captures user-submitted feedback so the founder can review at
-- /admin/feedback instead of getting buried in email. Auth-only:
-- spam concerns + we want context (who, where).
-- ============================================================

create table if not exists feedback (
  id            uuid primary key default gen_random_uuid(),
  -- Nullable user_id so an account deletion doesn't wipe the report —
  -- useful history even if the reporter is gone.
  user_id       uuid references auth.users(id) on delete set null,
  -- Snapshot the email at submit time so it survives account deletion
  -- and so we don't need a join to display the reporter on the admin page.
  user_email    text,
  category      text not null check (category in ('bug', 'suggestion', 'general')),
  message       text not null,
  -- Free-text "where were you when this happened?" — keeps it simple
  -- (vs auto-capturing URL, which can drift if we change routes).
  context       text,
  status        text not null default 'new'
                check (status in ('new', 'reviewing', 'resolved', 'dismissed')),
  created_at    timestamptz not null default now()
);

create index if not exists feedback_created_idx on feedback(created_at desc);
create index if not exists feedback_status_idx  on feedback(status, created_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table feedback enable row level security;

-- Anyone signed in can submit (own user_id only).
drop policy if exists feedback_insert_own on feedback;
create policy feedback_insert_own on feedback
  for insert with check (auth.uid() = user_id);

-- Users can read back their own submissions (e.g. "did this go through?").
-- Admin reads use the service-role client, which bypasses RLS.
drop policy if exists feedback_select_own on feedback;
create policy feedback_select_own on feedback
  for select using (auth.uid() = user_id);

-- ============================================================
-- Grants
-- ============================================================
grant select, insert on public.feedback to authenticated;
grant all on public.feedback to service_role;
