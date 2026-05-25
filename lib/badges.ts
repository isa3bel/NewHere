import type { Badge, Task } from "./types";

// Pure function: given the current state, return which badges (from `all`)
// the user has now satisfied that they haven't already earned.
// No DB calls — caller is responsible for granting whatever this returns.
export function evaluateBadges(
  tasks: Task[],
  all: Badge[],
  alreadyEarned: ReadonlySet<string>,
): Badge[] {
  const completed = tasks.filter((t) => t.status === "done");
  const completedCount = completed.length;
  const eventAttendanceDone = completed.filter((t) => t.isEventAttendance).length;
  const recurringDone = completed.filter((t) => t.isRecurringActivity).length;
  const totalTasks = tasks.length;
  const completionPct =
    totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const newlyEarned: Badge[] = [];
  for (const badge of all) {
    if (alreadyEarned.has(badge.id)) continue;
    if (badgeIsSatisfied(badge, {
      completedCount,
      eventAttendanceDone,
      recurringDone,
      completionPct,
    })) {
      newlyEarned.push(badge);
    }
  }
  return newlyEarned;
}

type Counts = {
  completedCount: number;
  eventAttendanceDone: number;
  recurringDone: number;
  completionPct: number;
};

function badgeIsSatisfied(badge: Badge, c: Counts): boolean {
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
