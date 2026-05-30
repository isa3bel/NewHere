"use client";

import { useMemo, useState } from "react";

import {
  getDayCandidatesForAnchor,
  getRoutingForAnchor,
  hashAnchorId,
  slotSortKey,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  type RoutineSlot,
  type WeekDay,
} from "@/lib/routine-slots";
import type { Task } from "@/lib/types";

// Realistic weekly cap — no one actually does five different things
// every single day. Anchors that don't fit this round get cycled in
// when the user clicks Reshuffle.
const MAX_ANCHORS_PER_DAY = 2;

// "Your routine" — third phase. Replaces the old 4-slot grid with a
// 7-day suggested-week calendar. Each kept anchor lands on a day picked
// from its schedule string (explicit days take priority; vague
// schedules fall back to slot-based defaults — weekend slot → Sat/Sun,
// weekday slot → Mon-Fri). A small "↻ Reshuffle" button at the top
// rotates anchors that have multiple legitimate days; anchors with a
// single fixed day (e.g. "Saturdays 8am") stay put.
//
// Deterministic — no AI, no web search. Same input + seed always
// produces the same layout, so the user can navigate away and back
// without things jumping around.

type Props = {
  tasks: Task[];
  allTasks: Task[];
  focusIds: Set<string>;
  // Profile city used to filter stale anchors created under a previous
  // city. Tasks with a non-null createdCity that doesn't match the
  // current profile city are hidden.
  currentCity: string | null;
  // sourceItemIds of every tile in the AI cache for the current
  // profile (pre-move + Month 1). Hides anchors from earlier AI
  // generations whose tiles have since been regenerated away.
  currentAiTileIds: Set<string>;
};

type ScheduledAnchor = {
  task: Task;
  day: WeekDay;
  slot: RoutineSlot;
  cadence: string;
  emoji: string;
};

type UnslottedAnchor = {
  task: Task;
  cadence: string;
  emoji: string;
};

function normalizeCity(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function isStaticSourceId(id: string): boolean {
  return (
    id.startsWith("w1-") ||
    id.startsWith("m1-") ||
    id.startsWith("q1-") ||
    id.startsWith("deepen:")
  );
}

export function Quarter1Section({
  allTasks,
  currentCity,
  currentAiTileIds,
}: Props) {
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const current = normalizeCity(currentCity);
  const anchors = useMemo(
    () =>
      allTasks.filter((t) => {
        if (t.keeperState !== "keep") return false;
        if (t.createdCity && normalizeCity(t.createdCity) !== current) {
          return false;
        }
        if (!t.sourceItemId) return true;
        if (isStaticSourceId(t.sourceItemId)) return true;
        return currentAiTileIds.has(t.sourceItemId);
      }),
    [allTasks, current, currentAiTileIds],
  );

  const { byDay, unslotted, skippedCount, scheduledCount } = useMemo(() => {
    const byDay = new Map<WeekDay, ScheduledAnchor[]>();
    const unslotted: UnslottedAnchor[] = [];

    // Process anchors in a shuffle-stable order so the calendar
    // can rotate which ones get prime real estate. Anchors processed
    // first claim their preferred day; later ones find that day full
    // and fall through to alternates (or get skipped if all their
    // valid days are full).
    const sortableAnchors = anchors.filter((a) => {
      const routing = getRoutingForAnchor(a);
      if (routing.slot === null) {
        unslotted.push({
          task: a,
          cadence: routing.cadence,
          emoji: routing.emoji,
        });
        return false;
      }
      return true;
    });

    const ordered = [...sortableAnchors].sort((a, b) => {
      const sa = hashAnchorId(a.id) + shuffleSeed * 31;
      const sb = hashAnchorId(b.id) + shuffleSeed * 31;
      return sa - sb;
    });

    let skipped = 0;
    let scheduled = 0;
    for (const anchor of ordered) {
      const routing = getRoutingForAnchor(anchor);
      if (routing.slot === null) continue;
      const details = anchor.detailsJson as
        | { meta?: { schedule?: string } }
        | null
        | undefined;
      const schedule = details?.meta?.schedule;
      const candidates = getDayCandidatesForAnchor(
        routing.slot,
        schedule,
        shuffleSeed + hashAnchorId(anchor.id),
      );

      let placed = false;
      for (const day of candidates) {
        const bucket = byDay.get(day) ?? [];
        if (bucket.length >= MAX_ANCHORS_PER_DAY) continue;
        bucket.push({
          task: anchor,
          day,
          slot: routing.slot,
          cadence: routing.cadence,
          emoji: routing.emoji,
        });
        byDay.set(day, bucket);
        placed = true;
        scheduled += 1;
        break;
      }
      if (!placed) skipped += 1;
    }

    for (const bucket of byDay.values()) {
      bucket.sort((a, b) => slotSortKey(a.slot) - slotSortKey(b.slot));
    }
    return { byDay, unslotted, skippedCount: skipped, scheduledCount: scheduled };
  }, [anchors, shuffleSeed]);

  const totalAnchors = anchors.length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
        <h3 className="text-base font-semibold">Your suggested week</h3>
        {scheduledCount > 0 && (
          <button
            type="button"
            onClick={() => setShuffleSeed((s) => s + 1)}
            className="text-xs text-[var(--muted-foreground)] underline-offset-2 hover:underline hover:text-[var(--accent)] inline-flex items-center gap-1"
            aria-label="Reshuffle the suggested days"
          >
            ↻ Reshuffle
          </button>
        )}
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        A suggested weekly rhythm built from what you&apos;ve kept. Days
        are a starting point — the actual day is up to you.
      </p>

      {totalAnchors === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
            {WEEK_DAYS.map((day) => (
              <DayCell
                key={day}
                day={day}
                anchors={byDay.get(day) ?? []}
              />
            ))}
          </div>

          {unslotted.length > 0 && (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
                Not part of a recurring slot
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mb-3">
                One-time or setup tasks — kept for reference but don&apos;t
                shape a weekly rhythm.
              </p>
              <ul className="flex flex-wrap gap-2">
                {unslotted.map((s) => (
                  <AnchorPill key={s.task.id} anchor={s} />
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            {skippedCount > 0
              ? `Showing ${scheduledCount} of ${totalAnchors - unslotted.length} kept anchor${
                  totalAnchors - unslotted.length === 1 ? "" : "s"
                } — reshuffle to see different combinations. A week realistically fits ~2 per day.`
              : `${totalAnchors} anchor${
                  totalAnchors === 1 ? "" : "s"
                } · this section evolves as you add more keepers.`}
          </p>
        </>
      )}
    </div>
  );
}

function DayCell({
  day,
  anchors,
}: {
  day: WeekDay;
  anchors: ScheduledAnchor[];
}) {
  const label = WEEK_DAY_LABELS[day];
  const empty = anchors.length === 0;

  return (
    <div
      className={`rounded-2xl border p-3 ${
        empty
          ? "border-dashed border-[var(--border)] bg-[var(--background)] min-h-12 md:min-h-32"
          : "border-[var(--accent)] bg-[var(--card)] min-h-32"
      }`}
    >
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          {label.short}
        </p>
        {!empty && (
          <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums">
            {anchors.length}
          </span>
        )}
      </div>
      {empty ? (
        <p className="text-xs text-[var(--muted-foreground)] italic">—</p>
      ) : (
        <ul className="space-y-2">
          {anchors.map((s) => (
            <li key={s.task.id} className="flex items-start gap-1.5">
              <span
                className="text-base flex-shrink-0 leading-tight"
                aria-hidden
              >
                {s.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium leading-snug"
                  title={s.task.title}
                >
                  {s.task.title}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                  {timeOfDayLabel(s.slot)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function timeOfDayLabel(slot: RoutineSlot): string {
  switch (slot) {
    case "weekday_morning":
    case "weekend_morning":
      return "morning";
    case "weekday_evening":
    case "weekend_evening":
      return "evening";
  }
}

function AnchorPill({ anchor }: { anchor: UnslottedAnchor }) {
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
        <strong>Keep</strong>, and they&apos;ll show up here — slotted
        into the day they&apos;d typically happen.
      </p>
    </div>
  );
}
