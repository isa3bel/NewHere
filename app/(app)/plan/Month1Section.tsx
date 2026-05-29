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

  const extrasFlat = Object.values(extras).flat();
  const total = useAi ? aiTiles.length + extrasFlat.length : tasks.length;
  const triedCount = tasks.filter((t) => t.status === "done").length;
  const keptCount = tasks.filter((t) => t.keeperState === "keep").length;

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
            const goalTiles = aiByGoal.get(goal) ?? [];
            const goalExtras = extras[goal] ?? [];
            if (goalTiles.length === 0 && goalExtras.length === 0) return null;
            const isLoading = loadingGoal === goal;
            const alreadyLoaded = loadedGoals.has(goal);
            const err = errors[goal];
            const anotherInFlight =
              loadingGoal !== null && loadingGoal !== goal;
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
                    return (
                      <Month1AiTile
                        key={s.tile.id}
                        tile={s.tile}
                        completed={s.completed}
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
                </div>
                <div className="mt-3 flex items-center gap-3 min-h-5">
                  {!alreadyLoaded && (
                    <button
                      type="button"
                      onClick={() => handleLoadMore(goal)}
                      disabled={isLoading || anotherInFlight}
                      className="text-xs text-[var(--muted-foreground)] underline-offset-2 hover:underline hover:text-[var(--accent)] disabled:opacity-50 disabled:cursor-wait"
                    >
                      {isLoading ? "Finding more…" : "+ Load more"}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-start">
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-start">
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
