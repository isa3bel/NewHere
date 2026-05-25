import { evaluateBadges } from "./badges";
import {
  MOCK_USER_ID,
  mockBadges,
  mockPlan,
  mockProfile,
  mockTasks,
  mockUserBadges,
} from "./mock-data";
import type {
  Badge,
  Plan,
  Profile,
  Task,
  TaskStatus,
  UserBadge,
} from "./types";

// In-memory store. Resets on server restart, which is fine for MVP dev.
// When Supabase is wired up, replace each function body with real queries.
const store = {
  profiles: new Map<string, Profile>([[MOCK_USER_ID, mockProfile]]),
  plans: new Map<string, Plan>([[mockPlan.id, mockPlan]]),
  tasks: new Map<string, Task>(mockTasks.map((t) => [t.id, t])),
  badges: [...mockBadges] as Badge[],
  userBadges: [...mockUserBadges] as UserBadge[],
};

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
  return [...store.tasks.values()]
    .filter((t) => t.planId === planId)
    .sort((a, b) => a.dayOffset - b.dayOffset || a.orderIndex - b.orderIndex);
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
  };
  store.tasks.set(taskId, updated);
  return updated;
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
