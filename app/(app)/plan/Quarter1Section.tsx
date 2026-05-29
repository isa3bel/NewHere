import {
  getRoutingForAnchor,
  SLOT_LABELS,
  SLOT_ORDER,
  type RoutineSlot,
} from "@/lib/routine-slots";
import type { Task } from "@/lib/types";

// "Your routine" (the third phase, formerly "Go deeper") synthesizes the
// user's kept anchors into a suggested weekly schedule. Each anchor is
// slotted into a time-of-day bucket (weekday morning, weekday evening,
// weekend morning, weekend evening) based on a small lookup map.
//
// Empty state when no anchors: nudges back to Month 1 to find some.
//
// `tasks` here is all Quarter 1 phase tasks (legacy/empty in the current
// design — we look at the full plan instead via `allTasks` to find kept
// anchors regardless of phase).
type Props = {
  tasks: Task[];
  allTasks: Task[];
  focusIds: Set<string>;
  // sourceItemIds of every tile currently in the AI cache for the
  // user's profile (pre-move + Month 1). Used to filter out stale
  // anchors — e.g. a "Keep it" from a previous city whose AI tile
  // no longer exists.
  currentAiTileIds: Set<string>;
};

type SlottedAnchor = {
  task: Task;
  cadence: string;
  emoji: string;
};

// Static starter tasks have stable source IDs across profile changes.
// Anything else is AI-generated and only valid if still in the cache.
function isStaticSourceId(id: string): boolean {
  return (
    id.startsWith("w1-") ||
    id.startsWith("m1-") ||
    id.startsWith("q1-") ||
    id.startsWith("deepen:")
  );
}

export function Quarter1Section({ allTasks, currentAiTileIds }: Props) {
  // Find all anchors (kept tasks) regardless of phase. A user's anchor
  // could come from Month 1 or from a custom For You task.
  //
  // Filter out stale AI-tile-sourced anchors: when a user changes
  // city/profile, the AI cache regenerates with new tile IDs. Any
  // anchor whose sourceItemId references a tile that's no longer in
  // the cache is from a previous profile and would render with stale
  // (e.g. wrong-city) details in the routine grid. Static starter
  // anchors (w1-/m1-/q1-/deepen:) bypass the filter — they're stable
  // across profile changes.
  const anchors = allTasks.filter((t) => {
    if (t.keeperState !== "keep") return false;
    if (!t.sourceItemId) return true;
    if (isStaticSourceId(t.sourceItemId)) return true;
    return currentAiTileIds.has(t.sourceItemId);
  });

  // Bucket each anchor by routine slot. Anchors whose routing is `null`
  // (one-off setup tasks) are collected separately and shown as
  // "Not part of a recurring slot."
  const bySlot = new Map<RoutineSlot, SlottedAnchor[]>();
  const unslotted: SlottedAnchor[] = [];
  for (const anchor of anchors) {
    const routing = getRoutingForAnchor(anchor);
    const slotted: SlottedAnchor = {
      task: anchor,
      cadence: routing.cadence,
      emoji: routing.emoji,
    };
    if (routing.slot === null) {
      unslotted.push(slotted);
    } else {
      const bucket = bySlot.get(routing.slot) ?? [];
      bucket.push(slotted);
      bySlot.set(routing.slot, bucket);
    }
  }

  const totalAnchors = anchors.length;

  return (
    <div>
      <h3 className="text-base font-semibold mb-1">Your suggested week</h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        Here&apos;s what your week could look like, based on the things
        you&apos;ve kept. Updates as you add more anchors.
      </p>

      {totalAnchors === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SLOT_ORDER.map((slot) => (
              <SlotCard
                key={slot}
                label={SLOT_LABELS[slot]}
                anchors={bySlot.get(slot) ?? []}
              />
            ))}
          </div>

          {unslotted.length > 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
                Not part of a recurring slot
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mb-3">
                One-time or setup tasks — kept for reference, but they
                don&apos;t shape a weekly rhythm.
              </p>
              <ul className="flex flex-wrap gap-2">
                {unslotted.map((s) => (
                  <AnchorPill key={s.task.id} anchor={s} />
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            {totalAnchors} anchor{totalAnchors === 1 ? "" : "s"} · this
            section evolves as you add more keepers.
          </p>
        </>
      )}
    </div>
  );
}

function SlotCard({
  label,
  anchors,
}: {
  label: string;
  anchors: SlottedAnchor[];
}) {
  const empty = anchors.length === 0;
  return (
    <div
      className={`rounded-2xl border p-4 min-h-[7rem] ${
        empty
          ? "border-dashed border-[var(--border)] bg-[var(--background)]"
          : "border-[var(--accent)] bg-[var(--card)]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
        {label}
      </p>
      {empty ? (
        <p className="text-xs text-[var(--muted-foreground)] italic">
          —
        </p>
      ) : (
        <ul className="space-y-2">
          {anchors.map((s) => (
            <li key={s.task.id} className="flex items-start gap-2">
              <span className="text-base flex-shrink-0 leading-tight" aria-hidden>
                {s.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">
                  {s.task.title}
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                  {s.cadence}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnchorPill({ anchor }: { anchor: SlottedAnchor }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs">
      <span aria-hidden>{anchor.emoji}</span>
      <span>{anchor.task.title}</span>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted-foreground)]">
      <p className="font-medium text-[var(--foreground)] mb-1">
        Your week takes shape from what you keep.
      </p>
      <p>
        Try things in <strong>Month 1</strong>, mark any you love as{" "}
        <strong>Keep</strong>, and they&apos;ll show up here — slotted into
        when they&apos;d typically happen in your week.
      </p>
    </div>
  );
}
