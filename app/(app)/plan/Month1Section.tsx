import type { Task, TaskCategory } from "@/lib/types";

import { Month1Tile } from "./Month1Tile";

// "Try things" (Month 1) is reframed as a small set of outcome-based clusters
// rather than one big grid. The point is to convert "11 things I have to do"
// into "4 small decisions: pick one from each cluster I care about."
//
// Each cluster has at most a few tiles. The user is told the goal explicitly
// at the top ("try ~4, keep 2"), so the page reads as a sampler, not a
// checklist.

type Cluster = {
  category: TaskCategory;
  outcome: string;
  prompt: string;
};

const CLUSTERS: Cluster[] = [
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

type Props = {
  tasks: Task[];
  focusIds: Set<string>;
};

export function Month1Section({ tasks, focusIds }: Props) {
  const byCategory = new Map<TaskCategory, Task[]>();
  for (const task of tasks) {
    const bucket = byCategory.get(task.category) ?? [];
    bucket.push(task);
    byCategory.set(task.category, bucket);
  }

  // Stats for the goal-frame header
  const total = tasks.length;
  const triedCount = tasks.filter((t) => t.status === "done").length;
  const keptCount = tasks.filter((t) => t.keeperState === "keep").length;

  return (
    <div>
      <GoalFrame total={total} tried={triedCount} kept={keptCount} />

      <div className="mt-6 space-y-8">
        {CLUSTERS.map((cluster) => {
          const clusterTasks = byCategory.get(cluster.category) ?? [];
          if (clusterTasks.length === 0) return null;
          const hasKeeper = clusterTasks.some(
            (t) => t.keeperState === "keep",
          );
          return (
            <ClusterSection
              key={cluster.category}
              cluster={cluster}
              tasks={clusterTasks}
              focusIds={focusIds}
              hasKeeper={hasKeeper}
            />
          );
        })}

        {/* Any tasks that don't fit a known cluster (e.g. essentials added
            from custom For You items) get a catch-all cluster. */}
        {byCategory.has("essentials") && (
          <ClusterSection
            cluster={{
              category: "essentials",
              outcome: "Other things to try",
              prompt: "Tasks added from your recommendations.",
            }}
            tasks={byCategory.get("essentials") ?? []}
            focusIds={focusIds}
            hasKeeper={false}
          />
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
  cluster,
  tasks,
  focusIds,
  hasKeeper,
}: {
  cluster: Cluster;
  tasks: Task[];
  focusIds: Set<string>;
  hasKeeper: boolean;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-2 flex-wrap mb-1">
        <h3 className="text-base font-semibold">{cluster.outcome}</h3>
        {hasKeeper && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
            ✓ Found a keeper
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        {cluster.prompt}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-start">
        {tasks.map((task) => (
          <Month1Tile
            key={task.id}
            task={task}
            isToday={focusIds.has(task.id)}
          />
        ))}
      </div>
    </section>
  );
}
