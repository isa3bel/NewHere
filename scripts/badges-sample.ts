import { evaluateBadges } from "../lib/badges";
import { mockBadges, mockTasks } from "../lib/mock-data";
import type { Task } from "../lib/types";

function withCompleted(ids: string[]): Task[] {
  return mockTasks.map((t) =>
    ids.includes(t.id)
      ? { ...t, status: "done", completedAt: new Date().toISOString() }
      : t,
  );
}

function scenario(label: string, completedIds: string[]) {
  const tasks = withCompleted(completedIds);
  const earned = evaluateBadges(tasks, mockBadges, new Set());
  console.log(`\n--- ${label} (${completedIds.length} task(s) done) ---`);
  console.log(`Earned: ${earned.map((b) => `${b.icon} ${b.name}`).join(", ") || "none"}`);
}

// 1 task → expect First Step only
scenario("Complete 1 task", ["t1"]);

// 1 event-attendance task → expect First Step + Showed Up
scenario("Complete 1 event-attendance task (t4 = climbing gym)", ["t4"]);

// 3 tasks → expect First Step + Momentum
scenario("Complete 3 tasks", ["t1", "t2", "t8"]);

// 2 recurring → expect First Step + Momentum + Regular
scenario(
  "Complete 2 recurring tasks (t3 coffee shop, t6 grocery)",
  ["t3", "t6"],
);

// 13 of 16 = 81% → expect everything including NewHere
scenario("Complete 13 of 16 tasks (81%)", [
  "t1","t2","t3","t4","t5","t6","t7","t8","t9","t10","t11","t12","t13",
]);
