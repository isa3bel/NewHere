import { evaluateBadges } from "./badges";
import { getDeepeningTemplates } from "./deepening-catalog";
import type { ForYouItem } from "./for-you-data";
import { mockTasks } from "./mock-data";
import { createSupabaseAdminClient } from "./supabase/admin";
import { createSupabaseServerClient } from "./supabase/server";
import { phaseForDay } from "./types";
import type {
  Badge,
  BadgeCriteria,
  KeeperState,
  Plan,
  Profile,
  Task,
  TaskCategory,
  TaskStatus,
  UserBadge,
} from "./types";

// ============================================================
// Row → domain-object conversions (snake_case DB → camelCase TS)
// ============================================================

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  city: string;
  neighborhood: string | null;
  move_date: string;
  social_style: Profile["socialStyle"];
  has_car: boolean;
  budget_tier: Profile["budgetTier"];
  interests: string[] | null;
  goals: string[] | null;
};

type PlanRow = {
  id: string;
  user_id: string;
  version: number;
  is_active: boolean;
  generated_at: string;
};

type TaskRow = {
  id: string;
  plan_id: string;
  user_id: string;
  category: TaskCategory;
  phase: Task["phase"];
  title: string;
  description: string | null;
  day_offset: number;
  link_url: string | null;
  status: TaskStatus;
  completed_at: string | null;
  order_index: number;
  is_event_attendance: boolean;
  is_recurring_activity: boolean;
  keeper_state: KeeperState;
  source_item_id: string | null;
  details_json: unknown | null;
};

type BadgeRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  criteria: BadgeCriteria;
};

type UserBadgeRow = {
  user_id: string;
  badge_id: string;
  earned_at: string;
};

function rowToProfile(r: ProfileRow): Profile {
  return {
    userId: r.user_id,
    displayName: r.display_name,
    city: r.city,
    // Defensive normalization: collapse empty/whitespace strings down to
    // null so downstream code only has to handle the null case.
    neighborhood: r.neighborhood?.trim() || null,
    moveDate: r.move_date,
    socialStyle: r.social_style,
    hasCar: r.has_car,
    budgetTier: r.budget_tier,
    interests: r.interests ?? [],
    goals: r.goals ?? [],
  };
}

function rowToPlan(r: PlanRow): Plan {
  return {
    id: r.id,
    userId: r.user_id,
    version: r.version,
    isActive: r.is_active,
    generatedAt: r.generated_at,
  };
}

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    planId: r.plan_id,
    userId: r.user_id,
    category: r.category,
    phase: r.phase,
    title: r.title,
    description: r.description,
    dayOffset: r.day_offset,
    linkUrl: r.link_url,
    status: r.status,
    completedAt: r.completed_at,
    orderIndex: r.order_index,
    isEventAttendance: r.is_event_attendance,
    isRecurringActivity: r.is_recurring_activity,
    keeperState: r.keeper_state,
    sourceItemId: r.source_item_id,
    detailsJson: r.details_json,
  };
}

function rowToBadge(r: BadgeRow): Badge {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    icon: r.icon,
    criteria: r.criteria,
  };
}

// ============================================================
// Profiles
// ============================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data as ProfileRow);
}

export async function upsertProfile(profile: Profile): Promise<Profile> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      user_id: profile.userId,
      display_name: profile.displayName,
      city: profile.city,
      neighborhood: profile.neighborhood,
      move_date: profile.moveDate,
      social_style: profile.socialStyle,
      has_car: profile.hasCar,
      budget_tier: profile.budgetTier,
      interests: profile.interests,
      goals: profile.goals,
    })
    .select()
    .single();
  if (error || !data) {
    throw new Error(`upsertProfile failed: ${error?.message ?? "no data"}`);
  }
  return rowToProfile(data as ProfileRow);
}

// ============================================================
// Plans
// ============================================================

export async function getActivePlan(userId: string): Promise<Plan | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return rowToPlan(data as PlanRow);
}

// Ensure the user has an active plan + the 28 starter tasks. Idempotent.
// Called on every onboarding so a brand-new user gets their own copy of
// the starter plan.
export async function ensurePlanForUser(userId: string): Promise<Plan> {
  const existing = await getActivePlan(userId);
  if (existing) return existing;

  const supabase = await createSupabaseServerClient();

  // 1) Create the plan
  const { data: planData, error: planErr } = await supabase
    .from("plans")
    .insert({ user_id: userId, version: 1, is_active: true })
    .select()
    .single();
  if (planErr || !planData) {
    throw new Error(`ensurePlanForUser plan failed: ${planErr?.message}`);
  }
  const plan = rowToPlan(planData as PlanRow);

  // 2) Bulk insert 28 starter tasks. We persist the mockTasks.id (e.g.
  // "w1-license") as source_item_id so the slot is identifiable later
  // — drives both the static task-guides lookup AND the AI overlay
  // matching for city-specific content.
  const taskRows = mockTasks.map((mt) => ({
    plan_id: plan.id,
    user_id: userId,
    category: mt.category,
    phase: mt.phase,
    title: mt.title,
    description: mt.description,
    day_offset: mt.dayOffset,
    link_url: mt.linkUrl,
    status: "pending" as TaskStatus,
    order_index: mt.orderIndex,
    is_event_attendance: mt.isEventAttendance,
    is_recurring_activity: mt.isRecurringActivity,
    source_item_id: mt.id,
  }));
  const { error: tasksErr } = await supabase.from("tasks").insert(taskRows);
  if (tasksErr) {
    throw new Error(`ensurePlanForUser tasks failed: ${tasksErr.message}`);
  }

  return plan;
}

// ============================================================
// Tasks
// ============================================================

export async function getTasksForPlan(planId: string): Promise<Task[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("plan_id", planId)
    .order("day_offset", { ascending: true })
    .order("order_index", { ascending: true });
  if (error || !data) return [];
  return (data as TaskRow[]).map(rowToTask);
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<Task | null> {
  const supabase = await createSupabaseServerClient();
  const updates: Record<string, unknown> = {
    status,
    completed_at: status === "done" ? new Date().toISOString() : null,
  };
  // Re-opening a completed task clears its keeper decision so the
  // user gets re-prompted next time they complete it.
  if (status !== "done") updates.keeper_state = "none";

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();
  if (error || !data) return null;
  return rowToTask(data as TaskRow);
}

export async function setTaskKeeperState(
  taskId: string,
  state: KeeperState,
): Promise<Task | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ keeper_state: state })
    .eq("id", taskId)
    .select()
    .single();
  if (error || !data) return null;
  return rowToTask(data as TaskRow);
}

// Reset the user's plan state back to "fresh": every starter task pending,
// keeper decisions cleared, badges cleared, custom-from-For-You tasks deleted.
// Called on (re-)onboarding.
export async function resetPlanProgress(userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Delete any custom tasks created from For You items.
  // Starter tasks now also carry source_item_id (e.g. "w1-license") so
  // they can be looked up by slot. Filter those out by their known
  // prefixes — only true For You tasks should be removed here.
  await supabase
    .from("tasks")
    .delete()
    .eq("user_id", userId)
    .not("source_item_id", "is", null)
    .not("source_item_id", "like", "w1-%")
    .not("source_item_id", "like", "m1-%")
    .not("source_item_id", "like", "q1-%");

  // Reset remaining tasks' progress
  await supabase
    .from("tasks")
    .update({
      status: "pending",
      completed_at: null,
      keeper_state: "none",
    })
    .eq("user_id", userId);

  // Clear earned badges (admin client — RLS blocks user_badges writes)
  const admin = createSupabaseAdminClient();
  await admin.from("user_badges").delete().eq("user_id", userId);
}

// ============================================================
// Badges
// ============================================================

export async function getBadges(): Promise<Badge[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .order("slug");
  if (error || !data) return [];
  return (data as BadgeRow[]).map(rowToBadge);
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId);
  if (error || !data) return [];
  return (data as UserBadgeRow[]).map((r) => ({
    userId: r.user_id,
    badgeId: r.badge_id,
    earnedAt: r.earned_at,
  }));
}

// Toggle a task's status and grant any newly-earned badges atomically.
// Badge writes use the service-role client because RLS intentionally
// blocks client INSERTs on user_badges — granting must be server-validated.
export async function toggleTaskAndAwardBadges(
  userId: string,
  taskId: string,
  nextStatus: TaskStatus,
): Promise<{ task: Task | null; newlyEarned: Badge[] }> {
  const task = await updateTaskStatus(taskId, nextStatus);
  if (!task) return { task: null, newlyEarned: [] };

  const [planTasks, allBadges, earned] = await Promise.all([
    getTasksForPlan(task.planId),
    getBadges(),
    getUserBadges(userId),
  ]);
  const earnedIds = new Set(earned.map((ub) => ub.badgeId));

  const newlyEarned = evaluateBadges(planTasks, allBadges, earnedIds);
  if (newlyEarned.length > 0) {
    const admin = createSupabaseAdminClient();
    const rows = newlyEarned.map((b) => ({
      user_id: userId,
      badge_id: b.id,
    }));
    await admin.from("user_badges").insert(rows);
  }

  return { task, newlyEarned };
}

// ============================================================
// Custom tasks created from For You / recommendation items
// ============================================================

const FOR_YOU_TYPE_TO_CATEGORY: Record<ForYouItem["type"], TaskCategory> = {
  event: "community",
  class: "hobby",
  organization: "community",
  community: "community",
  resource: "routine",
};

// Idempotent "Add to my plan" for a recommendation item. Unique partial
// index on (user_id, source_item_id) means the DB rejects duplicates;
// we check first to keep the public API simple.
export async function createTaskFromForYou(
  userId: string,
  planId: string,
  item: ForYouItem,
  currentDay: number,
): Promise<Task> {
  const supabase = await createSupabaseServerClient();

  // If the user has already added this item, return the existing task.
  const { data: existing } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("source_item_id", item.id)
    .maybeSingle();
  if (existing) return rowToTask(existing as TaskRow);

  // Otherwise insert. Schedule for the next reasonable day so it pops up
  // near-term rather than as a far-out commitment.
  const dayOffset = Math.max(0, currentDay + 1);
  const phase = phaseForDay(dayOffset);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      plan_id: planId,
      user_id: userId,
      category: FOR_YOU_TYPE_TO_CATEGORY[item.type],
      phase,
      title: item.title,
      description: item.shortDescription,
      day_offset: dayOffset,
      link_url: item.links[0]?.url ?? null,
      status: "pending" as TaskStatus,
      order_index: 0,
      is_event_attendance: item.type === "event" || item.type === "class",
      is_recurring_activity: false,
      source_item_id: item.id,
      // Persist the whole item so the detail panel can render the rich
      // content the user already saw in the pre-move dropdown.
      details_json: item,
    })
    .select()
    .single();
  if (error || !data) {
    throw new Error(`createTaskFromForYou failed: ${error?.message}`);
  }
  return rowToTask(data as TaskRow);
}

// ============================================================
// Deepening tasks (anchor → Quarter 1 "Go deeper" content)
// ============================================================

// When a user marks a task as Keep, insert the static deepening templates
// for that anchor into their Quarter 1 plan. Idempotent — checks for
// existing deepening tasks with the same anchor before inserting, so
// calling twice (or un-keeping and re-keeping) won't duplicate.
//
// source_item_id encodes the anchor source: `deepen:{anchorId}:{idx}`.
// This (a) makes deepening tasks identifiable on the plan page, (b) lets
// the unique partial index on (user_id, source_item_id) enforce dedup
// at the database level as well.
export async function ensureDeepeningTasksForAnchor(
  userId: string,
  anchor: Task,
): Promise<void> {
  const templates = getDeepeningTemplates(anchor.title);
  if (templates.length === 0) return;

  const supabase = await createSupabaseServerClient();

  // Skip if we already generated deepening tasks for this anchor.
  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", userId)
    .like("source_item_id", `deepen:${anchor.id}:%`)
    .limit(1);
  if (existing && existing.length > 0) return;

  const rows = templates.map((t, idx) => ({
    plan_id: anchor.planId,
    user_id: userId,
    category: t.category,
    phase: "quarter_one" as const,
    title: t.title,
    description: t.description,
    day_offset: t.dayOffset,
    link_url: null,
    status: "pending" as TaskStatus,
    order_index: idx,
    is_event_attendance: t.isEventAttendance,
    is_recurring_activity: t.isRecurringActivity,
    keeper_state: "none" as const,
    source_item_id: `deepen:${anchor.id}:${idx}`,
  }));

  const { error } = await supabase.from("tasks").insert(rows);
  if (error) {
    throw new Error(`ensureDeepeningTasksForAnchor failed: ${error.message}`);
  }
}
