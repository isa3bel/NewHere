"use client";

import { useState } from "react";

import { toggleTaskAction } from "@/app/actions";
import type { Task, TaskCategory } from "@/lib/types";

import { KeeperPrompt } from "./KeeperPrompt";

// Per-task visual + logistical metadata for the Month 1 tile grid.
// Hand-written for known starter tasks; falls back to category defaults
// for custom or unknown tasks. When AI + web search is wired up, this
// whole map gets replaced by a server call that returns the same shape
// keyed to the user's city.
type TileMeta = {
  thumbnail: string; // emoji standing in for an image
  interest: string;
  howToJoin?: string;
  openTimes?: string;
  cost?: string;
};

const TILE_META: Record<string, TileMeta> = {
  "m1-coffee-regular": {
    thumbnail: "☕",
    interest: "coffee",
    howToJoin:
      "Just walk in. Order something simple, sit for a while. Repeat twice this week — the staff start to recognize you by visit 3.",
    openTimes: "Most local shops: 7am – 4pm weekdays, slightly shorter weekends",
    cost: "$4–6 per visit",
  },
  "m1-grocery-routine": {
    thumbnail: "🛒",
    interest: "routine",
    howToJoin:
      "Pick a day (Sunday is common). Same store every week. Familiarity builds.",
    openTimes: "Most grocery chains: 6am – 10pm",
    cost: "Whatever you'd spend anyway",
  },
  "m1-climbing-gym": {
    thumbnail: "🧗",
    interest: "climbing",
    howToJoin:
      "Walk in, ask for a day pass at the front desk. Tell them you're new — they'll usually offer a quick orientation.",
    openTimes: "Typically 6am – 11pm, all days",
    cost: "Day pass $20–25 · gear rental $5–10",
  },
  "m1-meetup-rsvp": {
    thumbnail: "🎟️",
    interest: "community",
    howToJoin:
      "Search Meetup.com for your interest + city. Filter to 'this week'. Pick something that has ≥15 RSVPs (signal of an active group).",
    openTimes: "Varies — most events evenings and weekends",
    cost: "Most events free or under $10",
  },
  "m1-run-club": {
    thumbnail: "🏃",
    interest: "running",
    howToJoin:
      "Most clubs let you show up to your first run without signing up. Arrive 10 min early. Bring water. They'll call out groups by pace.",
    openTimes: "Most clubs meet 1–3x/week, evenings or weekend mornings",
    cost: "Free for first visits; ~$30–60/yr for full membership",
  },
  "m1-new-bookstore": {
    thumbnail: "📚",
    interest: "books",
    howToJoin:
      "Walk in. Browse. Talk to staff about a recent read — they always have a recommendation.",
    openTimes: "Most indie bookstores: 10am – 8pm",
    cost: "Free to browse, $15–30 if you buy",
  },
  "m1-meetup-attend": {
    thumbnail: "👋",
    interest: "community",
    howToJoin:
      "Show up to the one you RSVP'd to. Stay at least 45 minutes. Talk to two people.",
    openTimes: "Whatever you RSVP'd to",
  },
  "m1-weekly-anchor": {
    thumbnail: "🔁",
    interest: "routine",
    howToJoin:
      "Pick a thing you already enjoy. Block the same time every week. Don't negotiate with yourself once it's on the calendar.",
  },
  "m1-new-cuisine": {
    thumbnail: "🍽️",
    interest: "exploration",
    howToJoin:
      "Search 'best [cuisine you've never had] in [city]'. Pick something not in your usual neighborhood. Go alone if you have to.",
    cost: "$15–40 per meal",
  },
  "m1-invite": {
    thumbnail: "💬",
    interest: "community",
    howToJoin:
      "Text someone you've met once. 'Hey, would you want to grab coffee Saturday?' Keep it low-stakes.",
  },
  "m1-beginner-class": {
    thumbnail: "🎓",
    interest: "climbing",
    howToJoin:
      "Most gyms have a 90-min intro class for $25–50. Book online. Comes with gear rental.",
    openTimes: "Typically weekend mornings",
    cost: "$25–50",
  },
};

const CATEGORY_DEFAULT: Record<TaskCategory, { thumbnail: string; interest: string }> = {
  essentials: { thumbnail: "✔️", interest: "essentials" },
  community: { thumbnail: "🤝", interest: "community" },
  hobby: { thumbnail: "🎯", interest: "hobby" },
  routine: { thumbnail: "🔁", interest: "routine" },
  exploration: { thumbnail: "🗺️", interest: "exploration" },
};

function metaFor(task: Task): TileMeta {
  if (TILE_META[task.id]) return TILE_META[task.id];
  const fallback = CATEGORY_DEFAULT[task.category];
  return { thumbnail: fallback.thumbnail, interest: fallback.interest };
}

type Props = {
  task: Task;
  isToday: boolean;
};

export function Month1Tile({ task, isToday }: Props) {
  const [expanded, setExpanded] = useState(false);
  const meta = metaFor(task);
  const done = task.status === "done";
  const nextStatus = done ? "pending" : "done";

  return (
    <div
      className={`rounded-2xl border bg-[var(--card)] transition cursor-pointer ${
        expanded
          ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
          : "border-[var(--border)] hover:border-[var(--accent)]"
      }`}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Thumbnail header — emoji stands in for image */}
      <div className="flex items-center justify-center h-24 rounded-t-2xl text-5xl bg-[var(--background)]">
        <span aria-hidden>{meta.thumbnail}</span>
      </div>

      {/* Tile body */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <span className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
            {meta.interest}
          </span>
          {isToday && !expanded && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
              Today
            </span>
          )}
          {done && (
            <span className="text-[10px] text-[var(--accent)]">✓ done</span>
          )}
        </div>
        <h3
          className={`text-sm font-medium leading-snug ${
            done ? "line-through text-[var(--muted-foreground)]" : ""
          } ${expanded ? "" : "line-clamp-2"}`}
        >
          {task.title}
        </h3>
        {!expanded && (
          <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
            Day {task.dayOffset + 1} · tap for details
          </p>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div
          className="border-t border-[var(--border)] p-4 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {task.description && (
            <p className="text-sm text-[var(--muted-foreground)]">
              {task.description}
            </p>
          )}

          {/* Logistics section — placeholder for what AI + web search will fill */}
          <div className="rounded-xl bg-[var(--background)] border border-[var(--border)] p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              Logistics
            </p>
            <LogisticsRow label="When" value={`Day ${task.dayOffset + 1}`} />
            {meta.howToJoin && (
              <LogisticsRow label="How to join" value={meta.howToJoin} />
            )}
            {meta.openTimes && (
              <LogisticsRow label="Open times" value={meta.openTimes} />
            )}
            {meta.cost && <LogisticsRow label="Cost" value={meta.cost} />}
            {task.linkUrl && (
              <LogisticsRow
                label="Link"
                value={
                  <a
                    href={task.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline break-all"
                  >
                    {task.linkUrl}
                  </a>
                }
              />
            )}
            <p className="text-[10px] text-[var(--muted-foreground)] italic pt-2">
              Once AI + web search is wired up, the specifics here become
              real (live hours, addresses, links) keyed to your city.
            </p>
          </div>

          {/* Mark done */}
          <form
            action={toggleTaskAction}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3"
          >
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="nextStatus" value={nextStatus} />
            <button
              type="submit"
              className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
                done
                  ? "border border-[var(--border)] hover:border-[var(--accent)]"
                  : "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90"
              }`}
            >
              {done ? "Mark as not done" : "Mark as done"}
            </button>
          </form>

          {done && (task.isRecurringActivity || task.isEventAttendance) && (
            <KeeperPrompt taskId={task.id} state={task.keeperState} />
          )}
        </div>
      )}
    </div>
  );
}

function LogisticsRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 text-xs">
      <span className="font-medium text-[var(--foreground)] w-20 flex-shrink-0">
        {label}
      </span>
      <span className="text-[var(--muted-foreground)] flex-1">{value}</span>
    </div>
  );
}
