-- 0006_task_created_city.sql
--
-- Tag tasks with the city the user was in when they added it. Used by
-- Quarter 1 "Your routine" to filter out anchors created under a
-- previous city (e.g. "SF Climbing Gym" should disappear from routine
-- once the user moves to Austin) WITHOUT depending on the AI
-- suggestion cache — which would also incorrectly hide anchors created
-- via "Load more" (those tiles never persist server-side, so they were
-- never in the cache to begin with).
--
-- Nullable for backward compat: existing rows pre-this-migration keep
-- showing in routine regardless of city, which is the conservative
-- choice (don't retroactively hide a user's data).

ALTER TABLE tasks ADD COLUMN created_city text;
