import { evaluateBadges } from "./badges";
import type { ForYouItem } from "./for-you-data";
import {
  mockBadges,
  mockPlan,
  mockTasks,
  mockUserBadges,
} from "./mock-data";
import type { SavedItem } from "./saved-items";
import { phaseForDay } from "./types";
import type {
  Badge,
  KeeperState,
  Plan,
  Profile,
  SavedItemState,
  Task,
  TaskCategory,
  TaskStatus,
  UserBadge,
} from "./types";

// In-memory store. Profile starts empty so new visitors see a blank
// onboarding form. (mockProfile is exported from mock-data.ts as a
// reference shape.) When Supabase is wired up, replace each function body
// with real queries.
//
// The store is stashed on globalThis so that Next.js dev-mode HMR (which
// reloads modules whenever any imported file changes) doesn't wipe state
// the user has entered. Without this, your profile disappears every time
// the assistant edits a file during development.
type Store = {
  profiles: Map<string, Profile>;
  plans: Map<string, Plan>;
  tasks: Map<string, Task>;
  badges: Badge[];
  userBadges: UserBadge[];
  savedItems: SavedItem[];
};

function createStore(): Store {
  return {
    profiles: new Map(),
    plans: new Map([[mockPlan.id, mockPlan]]),
    tasks: new Map(
      mockTasks.map((t) => [
        t.id,
        // Default keeperState so mock-data doesn't have to set it on every entry.
        { keeperState: "none" as const, ...t },
      ]),
    ),
    badges: [...mockBadges],
    userBadges: [...mockUserBadges],
    savedItems: [],
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __newhereDevStore: Store | undefined;
}

// Pick up the existing dev store if one is stashed from a prior HMR cycle,
// then backfill any fields that didn't exist when it was first created.
// Without this, adding a new collection (e.g. `savedItems`) crashes the
// app until the dev server is restarted.
function ensureStore(): Store {
  const fresh = createStore();
  const existing = globalThis.__newhereDevStore;
  if (!existing) return fresh;
  for (const key of Object.keys(fresh) as (keyof Store)[]) {
    if (existing[key] === undefined) {
      // @ts-expect-error — assigning per-key to backfill missing collections
      existing[key] = fresh[key];
    }
  }
  // Backfill missing fields on tasks (e.g. keeperState added later).
  for (const [id, task] of existing.tasks) {
    if ((task as unknown as Record<string, unknown>).keeperState === undefined) {
      existing.tasks.set(id, { ...task, keeperState: "none" });
    }
  }
  return existing;
}

const store: Store = ensureStore();
globalThis.__newhereDevStore = store;

export async function getProfile(userId: string): Promise<Profile | null> {
  return store.profiles.get(userId) ?? null;
}

export async function upsertProfile(profile: Profile): Promise<Profile> {
  store.profiles.set(profile.userId, profile);
  return profile;
}

export async function getActivePlan(userId: string): Promise<Plan | null> {
  for (const plan of store.plans.values()) {
    if (plan.userId === userId && plan.isActive) return plan;
  }
  return null;
}

export async function getTasksForPlan(planId: string): Promise<Task[]> {
  dedupeCustomTasksForPlan(planId);
  return [...store.tasks.values()]
    .filter((t) => t.planId === planId)
    .sort((a, b) => a.dayOffset - b.dayOffset || a.orderIndex - b.orderIndex);
}

// Self-heal duplicate custom tasks left over from earlier builds where
// "Add to my plan" used a non-deterministic id. Groups custom tasks by
// title and keeps one — preferring the new deterministic id, otherwise
// the most recently created.
function dedupeCustomTasksForPlan(planId: string): void {
  const byTitle = new Map<string, Task[]>();
  for (const task of store.tasks.values()) {
    if (task.planId !== planId) continue;
    if (!task.id.startsWith("custom-")) continue;
    const bucket = byTitle.get(task.title) ?? [];
    bucket.push(task);
    byTitle.set(task.title, bucket);
  }
  for (const bucket of byTitle.values()) {
    if (bucket.length < 2) continue;
    const keep =
      bucket.find((t) => t.id.startsWith("custom-foryou-")) ??
      bucket
        .slice()
        .sort((a, b) => {
          const tsA = Number(a.id.split("-")[1]) || 0;
          const tsB = Number(b.id.split("-")[1]) || 0;
          return tsB - tsA;
        })[0];
    for (const t of bucket) {
      if (t.id !== keep.id) store.tasks.delete(t.id);
    }
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<Task | null> {
  const task = store.tasks.get(taskId);
  if (!task) return null;
  const updated: Task = {
    ...task,
    status,
    completedAt: status === "done" ? new Date().toISOString() : null,
    // Marking a task back to pending discards any prior "did this stick?"
    // answer; the user has to re-evaluate after completing it again.
    keeperState: status === "done" ? task.keeperState : "none",
  };
  store.tasks.set(taskId, updated);
  return updated;
}

export async function setTaskKeeperState(
  taskId: string,
  state: KeeperState,
): Promise<Task | null> {
  const task = store.tasks.get(taskId);
  if (!task) return null;
  const updated: Task = { ...task, keeperState: state };
  store.tasks.set(taskId, updated);
  return updated;
}

// Reset all of a user's plan state back to "fresh": every task pending,
// no badges earned, no custom tasks, no saved For You items. Called when
// a user (re-)onboards so their checklist starts empty regardless of any
// prior dev-session toggles.
export async function resetPlanProgress(userId: string): Promise<void> {
  for (const [id, task] of store.tasks) {
    if (task.userId !== userId) continue;
    if (task.id.startsWith("custom-")) {
      store.tasks.delete(id);
    } else {
      store.tasks.set(id, { ...task, status: "pending", completedAt: null });
    }
  }
  store.userBadges = store.userBadges.filter((ub) => ub.userId !== userId);
  store.savedItems = store.savedItems.filter((s) => s.userId !== userId);
}

// --- Saved For You items -------------------------------------------------

export async function getSavedItems(userId: string): Promise<SavedItem[]> {
  return store.savedItems
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function saveForYouItem(
  userId: string,
  item: ForYouItem,
  interest: string,
  state: SavedItemState = "shortlist",
): Promise<SavedItem> {
  const existingIdx = store.savedItems.findIndex(
    (s) => s.userId === userId && s.forYouItemId === item.id,
  );
  const saved: SavedItem = {
    forYouItemId: item.id,
    userId,
    snapshot: item,
    interest,
    state,
    savedAt: new Date().toISOString(),
  };
  if (existingIdx >= 0) {
    store.savedItems[existingIdx] = saved;
  } else {
    store.savedItems.push(saved);
  }
  return saved;
}

export async function unsaveForYouItem(
  userId: string,
  forYouItemId: string,
): Promise<void> {
  store.savedItems = store.savedItems.filter(
    (s) => !(s.userId === userId && s.forYouItemId === forYouItemId),
  );
}

export async function setSavedItemState(
  userId: string,
  forYouItemId: string,
  state: SavedItemState,
): Promise<void> {
  const idx = store.savedItems.findIndex(
    (s) => s.userId === userId && s.forYouItemId === forYouItemId,
  );
  if (idx >= 0) {
    store.savedItems[idx] = { ...store.savedItems[idx], state };
  }
}

// --- Custom tasks (created from For You) --------------------------------

const FOR_YOU_TYPE_TO_CATEGORY: Record<ForYouItem["type"], TaskCategory> = {
  event: "community",
  class: "hobby",
  organization: "community",
  community: "community",
  resource: "routine",
};

// Deterministic ID for a custom task created from a For You item, so
// repeated "Add to my plan" clicks are idempotent rather than duplicating.
export function customTaskIdForItem(itemId: string): string {
  return `custom-foryou-${itemId}`;
}

export async function createTaskFromForYou(
  userId: string,
  planId: string,
  item: ForYouItem,
  currentDay: number,
): Promise<Task> {
  const id = customTaskIdForItem(item.id);
  const existing = store.tasks.get(id);
  if (existing) return existing;

  // Schedule the task for the next reasonable day so it pops up as
  // a near-term action rather than a far-out commitment.
  const dayOffset = Math.max(0, currentDay + 1);
  const phase = phaseForDay(dayOffset);
  const task: Task = {
    id,
    planId,
    userId,
    category: FOR_YOU_TYPE_TO_CATEGORY[item.type],
    phase,
    title: item.title,
    description: item.shortDescription,
    dayOffset,
    linkUrl: item.links[0]?.url ?? null,
    status: "pending",
    completedAt: null,
    orderIndex: 0,
    isEventAttendance: item.type === "event" || item.type === "class",
    isRecurringActivity: false,
    keeperState: "none",
  };
  store.tasks.set(id, task);
  return task;
}

export async function getBadges(): Promise<Badge[]> {
  return [...store.badges];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  return store.userBadges.filter((b) => b.userId === userId);
}

async function grantBadge(userId: string, badgeId: string): Promise<void> {
  const already = store.userBadges.some(
    (ub) => ub.userId === userId && ub.badgeId === badgeId,
  );
  if (already) return;
  store.userBadges.push({
    userId,
    badgeId,
    earnedAt: new Date().toISOString(),
  });
}

// Toggle a task and grant any newly-earned badges atomically.
// In Supabase this becomes a single transaction (or RPC).
export async function toggleTaskAndAwardBadges(
  userId: string,
  taskId: string,
  nextStatus: TaskStatus,
): Promise<{ task: Task | null; newlyEarned: Badge[] }> {
  const task = await updateTaskStatus(taskId, nextStatus);
  if (!task) return { task: null, newlyEarned: [] };

  const planTasks = await getTasksForPlan(task.planId);
  const allBadges = await getBadges();
  const earned = await getUserBadges(userId);
  const earnedIds = new Set(earned.map((ub) => ub.badgeId));

  const newlyEarned = evaluateBadges(planTasks, allBadges, earnedIds);
  for (const badge of newlyEarned) {
    await grantBadge(userId, badge.id);
  }

  return { task, newlyEarned };
}
