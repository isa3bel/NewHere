import type { Badge, Task } from "./types";

export type BadgeCounts = {
  completedCount: number;
  eventAttendanceDone: number;
  recurringDone: number;
  completionPct: number;
};

export function computeBadgeCounts(tasks: Task[]): BadgeCounts {
  const completed = tasks.filter((t) => t.status === "done");
  const total = tasks.length;
  return {
    completedCount: completed.length,
    eventAttendanceDone: completed.filter((t) => t.isEventAttendance).length,
    recurringDone: completed.filter((t) => t.isRecurringActivity).length,
    completionPct: total > 0 ? (completed.length / total) * 100 : 0,
  };
}

// What does this badge require, expressed as current/target progress?
// Used by the dashboard to show "X / Y" for unearned badges.
export function badgeProgress(
  badge: Badge,
  counts: BadgeCounts,
): { current: number; target: number; unit: "tasks" | "percent" } {
  switch (badge.criteria.type) {
    case "tasks_completed":
      return {
        current: Math.min(counts.completedCount, badge.criteria.count),
        target: badge.criteria.count,
        unit: "tasks",
      };
    case "event_attendance":
      return {
        current: Math.min(counts.eventAttendanceDone, badge.criteria.count),
        target: badge.criteria.count,
        unit: "tasks",
      };
    case "recurring_completed":
      return {
        current: Math.min(counts.recurringDone, badge.criteria.count),
        target: badge.criteria.count,
        unit: "tasks",
      };
    case "completion_pct":
      return {
        current: Math.min(Math.round(counts.completionPct), badge.criteria.pct),
        target: badge.criteria.pct,
        unit: "percent",
      };
  }
}

// Pure function: given the current state, return which badges (from `all`)
// the user has now satisfied that they haven't already earned.
// No DB calls — caller is responsible for granting whatever this returns.
export function evaluateBadges(
  tasks: Task[],
  all: Badge[],
  alreadyEarned: ReadonlySet<string>,
): Badge[] {
  const counts = computeBadgeCounts(tasks);
  const newlyEarned: Badge[] = [];
  for (const badge of all) {
    if (alreadyEarned.has(badge.id)) continue;
    if (badgeIsSatisfied(badge, counts)) {
      newlyEarned.push(badge);
    }
  }
  return newlyEarned;
}

function badgeIsSatisfied(badge: Badge, c: BadgeCounts): boolean {
  switch (badge.criteria.type) {
    case "tasks_completed":
      return c.completedCount >= badge.criteria.count;
    case "event_attendance":
      return c.eventAttendanceDone >= badge.criteria.count;
    case "recurring_completed":
      return c.recurringDone >= badge.criteria.count;
    case "completion_pct":
      return c.completionPct >= badge.criteria.pct;
  }
}
