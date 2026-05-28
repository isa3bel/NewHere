import Link from "next/link";

import { PlanView } from "@/app/(app)/plan/PlanView";
import { mockTasks } from "@/lib/mock-data";
import {
  daysSinceMove,
  getTodaysFocus,
  moveSummary,
} from "@/lib/plan-progress";
import type { Task } from "@/lib/types";

// Public, no-auth sample of what a personalized NewHere plan looks like.
// Uses the static mock task data, hard-coded "Austin, mid-Month-1" persona,
// and a couple of anchors so the Routine / calendar surfaces are populated.
//
// Interactions (toggle done, mark keeper) will work visually but the
// underlying server actions require auth — clicking them bounces the user
// to /sign-in, which is fine UX for a sample.
export default function SamplePage() {
  // Construct a sample profile state: Austin, moved today (Day 1).
  // Day 1 means Week 1 ("Land & settle") is the current phase and
  // shows expanded by default.
  const todayIso = new Date().toISOString().slice(0, 10);

  const sampleCity = "Austin, TX";
  const sampleMoveDate = todayIso;
  const currentDay = daysSinceMove(sampleMoveDate);
  const summary = moveSummary(currentDay);

  // Build sample tasks from the mock starter plan. Mark a handful as done,
  // and promote four to anchors so all four routine slots are populated
  // (weekday morning, weekday evening, weekend morning, weekend evening).
  const DONE_IDS = new Set([
    "w1-license",
    "w1-utilities",
    "w1-library",
    "w1-health",
    "m1-coffee-regular",
    "m1-grocery-routine",
    "m1-climbing-gym",
    "m1-new-cuisine",
  ]);
  const ANCHOR_IDS = new Set([
    "m1-coffee-regular",    // → Weekday mornings
    "m1-climbing-gym",      // → Weekday evenings
    "m1-grocery-routine",   // → Weekend mornings
    "m1-new-cuisine",       // → Weekend afternoons / evenings
  ]);

  const tasks: Task[] = mockTasks.map((mt) => {
    const isDone = DONE_IDS.has(mt.id);
    const isAnchor = ANCHOR_IDS.has(mt.id);
    return {
      ...mt,
      id: `sample-${mt.id}`,
      status: isDone ? "done" : "pending",
      completedAt: isDone ? new Date().toISOString() : null,
      keeperState: isAnchor ? "keep" : "none",
      sourceItemId: null,
      detailsJson: null,
    };
  });

  const todaysFocus = getTodaysFocus(tasks, currentDay);

  return (
    <main className="flex flex-col flex-1 items-center">
      {/* Top banner — visible across the whole sample */}
      <div className="w-full bg-[var(--accent)] text-[var(--accent-foreground)]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">
            👀 This is a sample plan for a fictional user in Austin. Sign up
            to generate your own.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs underline hover:no-underline"
            >
              ← Home
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-9 items-center rounded-full bg-[var(--background)] px-4 text-sm font-medium text-[var(--foreground)] hover:opacity-90 transition"
            >
              Get my plan →
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl px-6 py-10">
        <header className="mt-2">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Sample plan
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2">
            {sampleCity}
          </h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">
              {summary.headline}
            </span>{" "}
            · {summary.detail}
          </p>
        </header>

        <div className="mt-10">
          <PlanView
            tasks={tasks}
            todaysFocus={todaysFocus}
            currentDay={currentDay}
            preMoveSuggestions={[]}
            weekOneOverlay={[]}
            city={sampleCity}
          />
        </div>
      </div>
    </main>
  );
}
