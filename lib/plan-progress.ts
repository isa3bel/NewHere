import { PHASE_RANGES } from "./types";
import type { Phase, Task } from "./types";

// Returns how many days have passed since the user moved. Negative if the
// move is still in the future. Uses local-time midnight for both sides.
export function daysSinceMove(moveDate: string, now: Date = new Date()): number {
  if (!moveDate) return 0;
  const move = new Date(moveDate);
  if (Number.isNaN(move.getTime())) return 0;
  const moveMidnight = new Date(move.getFullYear(), move.getMonth(), move.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ms = nowMidnight - moveMidnight;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export type PhaseStatus = "past" | "current" | "upcoming";

export function phaseStatus(phase: Phase, currentDay: number): PhaseStatus {
  const range = PHASE_RANGES[phase];
  if (currentDay > range.end) return "past";
  if (currentDay < range.start) return "upcoming";
  return "current";
}

// Pick 2–3 tasks that should be the user's focus right now.
//   - Prefer pending tasks at or near currentDay (window ±3 days)
//   - Fall back to the next upcoming pending task
//   - If the move is still in the future, returns [] — surface prep
//     suggestions via generatePreMoveSuggestions() instead
//   - If the plan is "done" (currentDay past end + nothing pending), empty
export function getTodaysFocus(tasks: Task[], currentDay: number): Task[] {
  if (currentDay < 0) return [];
  const pending = tasks.filter((t) => t.status !== "done");
  if (pending.length === 0) return [];

  const window = pending
    .filter((t) => Math.abs(t.dayOffset - currentDay) <= 3)
    .sort((a, b) => {
      const distA = Math.abs(a.dayOffset - currentDay);
      const distB = Math.abs(b.dayOffset - currentDay);
      if (distA !== distB) return distA - distB;
      return a.dayOffset - b.dayOffset;
    });

  if (window.length >= 2) return window.slice(0, 3);

  const upcoming = pending
    .filter((t) => t.dayOffset >= currentDay)
    .sort((a, b) => a.dayOffset - b.dayOffset);

  if (upcoming.length > 0) return upcoming.slice(0, 3);

  return [...pending]
    .sort((a, b) => b.dayOffset - a.dayOffset)
    .slice(0, 3);
}

// Human-friendly summary of where the user is. Used in the "Today" header.
export function moveSummary(currentDay: number): {
  headline: string;
  detail: string;
} {
  if (currentDay < -1) {
    const days = Math.abs(currentDay);
    return {
      headline: `${days} days until you move`,
      detail: "Here's what to line up before the move.",
    };
  }
  if (currentDay === -1 || currentDay === 0) {
    return {
      headline: "Move day",
      detail: "Day 1 — here's where to start.",
    };
  }
  if (currentDay <= 6) {
    return {
      headline: `Day ${currentDay + 1} · Land & settle`,
      detail: "Get the basics in place so the rest of life can happen.",
    };
  }
  if (currentDay <= 29) {
    return {
      headline: `Day ${currentDay + 1} · Try things`,
      detail: "Explore widely. You're collecting data, not making commitments.",
    };
  }
  if (currentDay <= 89) {
    return {
      headline: `Day ${currentDay + 1} · Your routine`,
      detail: "Your week, shaped by what you've kept.",
    };
  }
  return {
    headline: `Day ${currentDay + 1} · Living here`,
    detail: "You've worked through the 90-day plan. Your anchors are your life now.",
  };
}
