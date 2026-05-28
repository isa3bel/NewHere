-- ============================================================
-- Add details_json to tasks
-- ============================================================
-- Stores the full source object (e.g. a ForYouItem from the pre-move
-- AI cache) when a task is created from a recommendation. Lets the
-- detail panel render the rich content the user already saw — instead
-- of falling back to a generic guide.
-- Nullable; only ForYou-created tasks populate it.
-- ============================================================

alter table tasks
  add column if not exists details_json jsonb;
