import { evaluateBadges } from "../lib/badges";
import { mockBadges, mockTasks } from "../lib/mock-data";
import type { Task } from "../lib/types";

function withCompleted(ids: string[]): Task[] {
  return mockTasks.map((t) => {
    const base: Task = { keeperState: "none", sourceItemId: null, ...t };
    return ids.includes(t.id)
      ? { ...base, status: "done", completedAt: new Date().toISOString() }
      : base;
  });
}

function scenario(label: string, completedIds: string[]) {
  const tasks = withCompleted(completedIds);
  const earned = evaluateBadges(tasks, mockBadges, new Set());
  console.log(`\n--- ${label} (${completedIds.length} task(s) done) ---`);
  console.log(`Earned: ${earned.map((b) => `${b.icon} ${b.name}`).join(", ") || "none"}`);
}

// m1-climbing-gym = event_attendance; m1-coffee-regular + m1-grocery-routine = recurring

scenario("Complete 1 task", ["w1-license"]);
scenario("Complete 1 event-attendance task (climbing gym)", ["m1-climbing-gym"]);
scenario("Complete 3 tasks", ["w1-license", "w1-address", "w1-utilities"]);
scenario("Complete 2 recurring tasks (coffee shop + grocery)", [
  "m1-coffee-regular",
  "m1-grocery-routine",
]);

// 80% of 28 tasks = 22.4 -> need 23 done for NewHere
scenario("Complete 23 of 28 tasks (82%)", [
  "w1-license","w1-address","w1-utilities","w1-library","w1-health","w1-transit","w1-daily-shops","w1-home-safety",
  "m1-coffee-regular","m1-grocery-routine","m1-climbing-gym","m1-meetup-rsvp","m1-run-club","m1-new-bookstore",
  "m1-meetup-attend","m1-weekly-anchor","m1-new-cuisine","m1-invite","m1-beginner-class",
  "q1-day-trip","q1-host","q1-multi-week-class","q1-new-hood",
]);
