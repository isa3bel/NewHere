"use client";

import { useState, useTransition } from "react";

import { loadMoreMonth1TilesAction } from "@/app/actions";
import type { AiMonth1Tile } from "@/lib/ai/types";
import type { KeeperState, Task, TaskCategory } from "@/lib/types";

import { Month1AiTile } from "./Month1AiTile";
import { Month1Tile } from "./Month1Tile";
import type { Month1Suggestion } from "./PlanView";

// "Try things" (Month 1) shows one section per user goal when AI tiles
// are available (1-3 sections). Each tile's cluster field maps to a
// specific goal text. Falls back to the static 4-category layout when
// AI is unavailable.
//
// Per-goal "Load more" button triggers a fresh AI call for that one
// goal. Results are kept in client state only — refreshing the page
// resets the user to the default tile set. Capped to one click per
// goal per page load so the cost stays bounded.

type Props = {
  tasks: Task[];
  focusIds: Set<string>;
  aiTiles: Month1Suggestion[];
  // sourceItemId → backing task. Looked up per tile so that both the
  // initial AI tiles and the client-side load-more extras can surface
  // the KeeperPrompt after the user marks them done.
  taskMap: Record<string, { taskId: string; keeperState: KeeperState }>;
  goals: string[];
};

type StaticCluster = {
  category: TaskCategory;
  outcome: string;
  prompt: string;
};

const STATIC_CLUSTERS: StaticCluster[] = [
  {
    category: "community",
    outcome: "To meet people",
    prompt: "Pick one that sounds most like you.",
  },
  {
    category: "hobby",
    outcome: "To build a hobby",
    prompt: "Pick one to try this month.",
  },
  {
    category: "routine",
    outcome: "To establish a routine",
    prompt: "Pick one to anchor your week.",
  },
  {
    category: "exploration",
    outcome: "To explore your city",
    prompt: "Pick one to do this month.",
  },
];

export function Month1Section({
  tasks,
  focusIds,
  aiTiles,
  taskMap,
  goals,
}: Props) {
  const useAi = aiTiles.length > 0;

  const [extras, setExtras] = useState<Record<string, AiMonth1Tile[]>>({});
  const [loadedGoals, setLoadedGoals] = useState<Set<string>>(new Set());
  const [loadingGoal, setLoadingGoal] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  // Snapshot of the visible tile set per goal, captured at mount time.
  // Filters out any tile the user has already engaged with (done OR
  // kept) — for AI tiles, the existence of a backing task in taskMap
  // means the user clicked "✓ done", since that's the only path to
  // create a backing task. Engaged tiles graduate to history (done) or
  // to "Your routine" (kept); they shouldn't come back on next reload.
  //
  // Mid-session "Done" or "Keep" clicks don't reflow the grid — the
  // tile stays visible (showing done/keeper chip) until full page
  // reload, when this snapshot rebuilds against the backfilled cache.
  //
  // Dev-mode note: Next.js Fast Refresh can preserve useState across
  // code edits without remounting, so during local dev the snapshot
  // can look stale after a save. Hard-refresh (Ctrl/Cmd+Shift+R) or
  // restart `npm run dev` to force a clean mount.
  const [snapshotByGoal] = useState<Map<string, Month1Suggestion[]>>(() => {
    const m = new Map<string, Month1Suggestion[]>();
    for (const goal of goals) {
      const tilesForGoal: Month1Suggestion[] = [];
      for (const s of aiTiles) {
        if (s.tile.cluster === goal) tilesForGoal.push(s);
      }
      const visible = tilesForGoal
        .filter((s) => !taskMap[s.tile.id])
        .slice(0, 3);
      m.set(goal, visible);
    }
    return m;
  });

  const extrasFlat = Object.values(extras).flat();
  const total = useAi ? aiTiles.length + extrasFlat.length : tasks.length;

  // Tried / kept counts.
  //   AI path: count by intersecting AI tile IDs (initial + extras) with
  //     taskMap. Reading from phaseTasks alone would miss tasks that
  //     landed in the wrong phase earlier (before the phase override on
  //     createTaskFromForYou), and would mix in any Month 1 starter
  //     tasks the user happens to also have in their plan.
  //   Static path: keep the old phaseTasks-based count.
  let triedCount: number;
  let keptCount: number;
  if (useAi) {
    const tileIds = [
      ...aiTiles.map((s) => s.tile.id),
      ...extrasFlat.map((t) => t.id),
    ];
    triedCount = 0;
    keptCount = 0;
    for (const id of tileIds) {
      const backing = taskMap[id];
      if (!backing) continue;
      triedCount += 1;
      if (backing.keeperState === "keep") keptCount += 1;
    }
  } else {
    triedCount = tasks.filter((t) => t.status === "done").length;
    keptCount = tasks.filter((t) => t.keeperState === "keep").length;
  }

  // AI: bucket per goal label (cluster field).
  const aiByGoal = new Map<string, Month1Suggestion[]>();
  if (useAi) {
    for (const s of aiTiles) {
      const bucket = aiByGoal.get(s.tile.cluster) ?? [];
      bucket.push(s);
      aiByGoal.set(s.tile.cluster, bucket);
    }
  }

  // Static fallback: bucket by TaskCategory.
  const tasksByCategory = new Map<TaskCategory, Task[]>();
  if (!useAi) {
    for (const task of tasks) {
      const bucket = tasksByCategory.get(task.category) ?? [];
      bucket.push(task);
      tasksByCategory.set(task.category, bucket);
    }
  }

  const handleLoadMore = (goal: string) => {
    if (loadedGoals.has(goal) || loadingGoal !== null) return;
    setLoadingGoal(goal);
    setErrors((prev) => {
      if (!(goal in prev)) return prev;
      const next = { ...prev };
      delete next[goal];
      return next;
    });
    const existingIds = [
      ...(aiByGoal.get(goal) ?? []).map((s) => s.tile.id),
      ...(extras[goal] ?? []).map((t) => t.id),
    ];
    startTransition(async () => {
      const res = await loadMoreMonth1TilesAction({
        goal,
        excludeIds: existingIds,
      });
      if (res.status === "ok") {
        setExtras((prev) => ({
          ...prev,
          [goal]: [...(prev[goal] ?? []), ...res.tiles],
        }));
        setLoadedGoals((prev) => {
          const next = new Set(prev);
          next.add(goal);
          return next;
        });
      } else {
        setErrors((prev) => ({ ...prev, [goal]: res.message }));
      }
      setLoadingGoal(null);
    });
  };

  return (
    <div>
      <GoalFrame total={total} tried={triedCount} kept={keptCount} />

      <div className="mt-6 space-y-8">
        {useAi ? (
          goals.map((goal) => {
            // Render the mount-time snapshot. Mid-session "Keep it"
            // clicks do not reflow the grid — the kept tile stays
            // visible (now showing the "📌 In your routine" chip)
            // until the user refreshes the page, at which point the
            // snapshot rebuilds against the backfilled cache.
            const goalTiles = snapshotByGoal.get(goal) ?? [];
            const goalExtras = extras[goal] ?? [];
            if (goalTiles.length === 0 && goalExtras.length === 0) return null;
            const isLoading = loadingGoal === goal;
            const alreadyLoaded = loadedGoals.has(goal);
            const err = errors[goal];
            const anotherInFlight =
              loadingGoal !== null && loadingGoal !== goal;
            // Pad short goals (cache didn't provide / backfill failed
            // to fill 3 tiles) with placeholder cards so the user sees
            // a message instead of an uneven grid with a missing tile.
            // The skeleton tiles already cover the in-flight Load
            // more case, so suppress placeholders during loading.
            const TILES_PER_GOAL = 3;
            const missingCount = isLoading
              ? 0
              : Math.max(
                  0,
                  TILES_PER_GOAL - goalTiles.length - goalExtras.length,
                );
            return (
              <ClusterSection
                key={goal}
                outcome={goal}
                prompt="Pick what sounds most like you."
                hasKeeper={false}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                  {goalTiles.map((s) => {
                    const backing = taskMap[s.tile.id];
                    // Derive `completed` from live taskMap, not from
                    // the snapshotted Month1Suggestion (which freezes
                    // at false on mount and never updates). The only
                    // way to create a backing task on a Month 1 AI
                    // tile is "✓ done", so backing-exists implies
                    // completed — same as the extras branch below.
                    return (
                      <Month1AiTile
                        key={s.tile.id}
                        tile={s.tile}
                        completed={!!backing}
                        taskId={backing?.taskId ?? null}
                        keeperState={backing?.keeperState ?? null}
                      />
                    );
                  })}
                  {goalExtras.map((t) => {
                    const backing = taskMap[t.id];
                    // For extras the only path to backing is the "✓ done"
                    // click (we removed "+ plan"), so backing-exists implies
                    // completed.
                    return (
                      <Month1AiTile
                        key={t.id}
                        tile={t}
                        completed={!!backing}
                        taskId={backing?.taskId ?? null}
                        keeperState={backing?.keeperState ?? null}
                      />
                    );
                  })}
                  {isLoading && (
                    <>
                      <SkeletonTile />
                      <SkeletonTile />
                      <SkeletonTile />
                    </>
                  )}
                  {missingCount > 0 &&
                    Array.from({ length: missingCount }).map((_, i) => (
                      <MissingTileCard key={`missing-${goal}-${i}`} />
                    ))}
                </div>
                <div className="mt-3 flex items-center gap-3 min-h-5">
                  {!alreadyLoaded && (
                    <button
                      type="button"
                      onClick={() => handleLoadMore(goal)}
                      disabled={isLoading || anotherInFlight}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] underline-offset-2 hover:underline hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-wait"
                    >
                      {isLoading && <Spinner />}
                      {isLoading
                        ? "Searching the web for more…"
                        : "+ Load more"}
                    </button>
                  )}
                  {err && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {err}
                    </span>
                  )}
                </div>
              </ClusterSection>
            );
          })
        ) : (
          <>
            {STATIC_CLUSTERS.map((cluster) => {
              const clusterTasks = tasksByCategory.get(cluster.category) ?? [];
              if (clusterTasks.length === 0) return null;
              const hasKeeper = clusterTasks.some(
                (t) => t.keeperState === "keep",
              );
              return (
                <ClusterSection
                  key={cluster.category}
                  outcome={cluster.outcome}
                  prompt={cluster.prompt}
                  hasKeeper={hasKeeper}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {clusterTasks.map((task) => (
                      <Month1Tile
                        key={task.id}
                        task={task}
                        isToday={focusIds.has(task.id)}
                      />
                    ))}
                  </div>
                </ClusterSection>
              );
            })}
            {tasksByCategory.has("essentials") && (
              <ClusterSection
                outcome="Other things to try"
                prompt="Tasks added from your recommendations."
                hasKeeper={false}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(tasksByCategory.get("essentials") ?? []).map((task) => (
                    <Month1Tile
                      key={task.id}
                      task={task}
                      isToday={focusIds.has(task.id)}
                    />
                  ))}
                </div>
              </ClusterSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GoalFrame({
  total,
  tried,
  kept,
}: {
  total: number;
  tried: number;
  kept: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
        Your goal this month
      </p>
      <p className="text-base font-medium leading-snug">
        Try ~4 things. The ones that stick become your anchors.
      </p>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        You don&apos;t need to do all {total}. The point is to sample,
        then keep what works.
      </p>
      {(tried > 0 || kept > 0) && (
        <div className="mt-4 flex items-center gap-4 text-xs">
          <Stat label="Tried" value={tried} tone="muted" />
          <Stat label="Kept" value={kept} tone="accent" />
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "muted";
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={`text-lg font-semibold tabular-nums ${
          tone === "accent" ? "text-[var(--accent)]" : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </span>
      <span className="uppercase tracking-widest text-[var(--muted-foreground)]">
        {label}
      </span>
    </div>
  );
}

// Placeholder tile shown while a "Load more" call is in flight. Matches
// the rough shape of Month1AiTile (icon block + title + meta lines) so
// the grid doesn't reflow when real tiles arrive.
// Placeholder rendered in goal sections where a tile slot couldn't be
// filled — usually because the background `after()` backfill from
// markForYouCompletedAction silently failed (daily limit hit, Claude
// returned all duplicates, etc.) and the inline safety net also
// couldn't recover. Communicates the state rather than leaving an
// uneven grid with a missing third tile.
function MissingTileCard() {
  return (
    <article
      className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] overflow-hidden flex flex-col items-center justify-center p-5 text-center min-h-[180px]"
      aria-label="Suggestion unavailable"
    >
      <span className="text-2xl mb-2" aria-hidden>
        ⚠️
      </span>
      <p className="text-sm font-medium leading-snug">
        Couldn&apos;t load a fresh suggestion
      </p>
      <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-snug">
        Refresh to try again, or check back tomorrow if you&apos;ve
        hit today&apos;s limit.
      </p>
    </article>
  );
}

function SkeletonTile() {
  return (
    <div
      className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden flex flex-col animate-pulse"
      aria-hidden
    >
      <div className="p-4 flex items-start gap-3">
        <div className="h-14 w-14 flex-shrink-0 rounded-xl bg-[var(--muted)]" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3.5 rounded bg-[var(--muted)] w-5/6" />
          <div className="h-3 rounded bg-[var(--muted)] w-4/6" />
          <div className="h-3 rounded bg-[var(--muted)] w-3/6 mt-3" />
        </div>
      </div>
      <div className="px-4 py-3 border-t border-[var(--border)]">
        <div className="h-6 w-16 rounded-full bg-[var(--muted)]" />
      </div>
    </div>
  );
}

// Small inline spinner used in the "Searching the web…" button label.
function Spinner() {
  return (
    <svg
      className="h-3 w-3 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClusterSection({
  outcome,
  prompt,
  hasKeeper,
  children,
}: {
  outcome: string;
  prompt: string;
  hasKeeper: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2 flex-wrap mb-1">
        <h3 className="text-base font-semibold">{outcome}</h3>
        {hasKeeper && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
            ✓ Found a keeper
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">{prompt}</p>
      {children}
    </section>
  );
}
