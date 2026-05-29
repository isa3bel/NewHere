// Maps each known starter anchor to a "time of day x weekday/weekend"
// slot — used by the "Your routine" section to synthesize a suggested
// weekly schedule from the user's kept anchors.
//
// When AI is wired up, this static map gets replaced by a server call
// that returns the same shape per anchor. The slot taxonomy stays the
// same so the UI doesn't need to change.

import type { ForYouItem } from "./for-you-data";
import type { Task, TaskCategory } from "./types";

export type RoutineSlot =
  | "weekday_morning"
  | "weekday_evening"
  | "weekend_morning"
  | "weekend_evening";

// `null` means "this anchor is a one-off or setup task — don't put it
// in the weekly routine grid." The Search Meetup / Set up a recurring
// anchor / Invite an acquaintance kinds of tasks don't represent a
// recurring slot in your week.
type AnchorRouting = {
  slot: RoutineSlot | null;
  cadence: string; // human-readable: "2–3x per week", "Saturday only"
  emoji: string;
};

const ANCHOR_ROUTING: Record<string, AnchorRouting> = {
  "Find a coffee shop you can become a regular at": {
    slot: "weekday_morning",
    cadence: "2–3 mornings/week",
    emoji: "☕",
  },
  "Establish a weekly grocery run": {
    slot: "weekend_morning",
    cadence: "Once a week",
    emoji: "🛒",
  },
  "Visit a local climbing gym for a day pass": {
    slot: "weekday_evening",
    cadence: "2x per week",
    emoji: "🧗",
  },
  "Search Meetup for events matching your interests and RSVP to one": {
    // setup task — not part of a weekly routine
    slot: null,
    cadence: "One-time",
    emoji: "🎟️",
  },
  "Join a running club": {
    slot: "weekend_morning",
    cadence: "Saturday + 1 weekday",
    emoji: "🏃",
  },
  "Visit a bookstore in a neighborhood you don't live in": {
    slot: "weekend_evening",
    cadence: "Once or twice a month",
    emoji: "📚",
  },
  "Attend the Meetup event you RSVP'd to": {
    slot: "weekday_evening",
    cadence: "Monthly",
    emoji: "👋",
  },
  "Set up a recurring weekly anchor": {
    // meta — the user is being asked to define an anchor; don't slot
    slot: null,
    cadence: "—",
    emoji: "🔁",
  },
  "Eat at a restaurant outside your usual cuisine": {
    slot: "weekend_evening",
    cadence: "Monthly",
    emoji: "🍽️",
  },
  "Invite one acquaintance to do something": {
    // one-time — not a recurring routine slot
    slot: null,
    cadence: "One-time",
    emoji: "💬",
  },
  "Book a beginner climbing class": {
    slot: "weekday_evening",
    cadence: "Once a week (course)",
    emoji: "🎓",
  },
};

// Defaults by category for unknown anchors (custom-added For You items or
// future AI-generated content). Rough mapping based on when each kind of
// thing typically happens.
const CATEGORY_DEFAULT: Record<TaskCategory, AnchorRouting> = {
  essentials: { slot: null, cadence: "One-time", emoji: "✔️" },
  community: { slot: "weekday_evening", cadence: "Weekly", emoji: "🤝" },
  hobby: { slot: "weekday_evening", cadence: "Weekly", emoji: "🎯" },
  routine: { slot: "weekday_morning", cadence: "Weekly", emoji: "🔁" },
  exploration: { slot: "weekend_evening", cadence: "Occasional", emoji: "🗺️" },
};

export function getRoutingForAnchor(task: Task): AnchorRouting {
  // 1. Static map for the known starter anchors (legacy titles).
  const fromTitle = ANCHOR_ROUTING[task.title];
  if (fromTitle) return fromTitle;

  // 2. AI-tile path: the For You item the user added is persisted on
  //    the task, so we can read its schedule text and infer a slot.
  const details = task.detailsJson as Partial<ForYouItem> | null | undefined;
  const schedule = details?.meta?.schedule;
  if (schedule) {
    const inferredSlot = inferSlotFromSchedule(schedule);
    if (inferredSlot) {
      return {
        slot: inferredSlot,
        cadence: schedule,
        emoji: details?.icon ?? CATEGORY_DEFAULT[task.category].emoji,
      };
    }
  }

  // 3. Category default fallback.
  return CATEGORY_DEFAULT[task.category];
}

// Heuristic: classify a schedule string like "Tuesdays 7pm" or
// "Saturday mornings" into one of the four routine slots. Returns
// null when we can't tell — caller falls back to the category default.
//
// Looks for two signals independently:
//   - day class:  weekend (sat/sun/weekend) vs weekday (mon–fri/weekday)
//   - time class: morning (am, "morning", hours 5–11) vs evening
//                 (pm, "evening", "night", "dinner", hours 12+)
// If a day signal is missing, defaults to weekday. If a time signal is
// missing, defaults to evening (community/hobby tend to be evening).
export function inferSlotFromSchedule(text: string): RoutineSlot | null {
  const s = text.toLowerCase();

  const weekendMention =
    /\b(sat|sun|saturday|sunday|weekend)s?\b/.test(s);
  const weekdayMention =
    /\b(mon|tue|tues|wed|thu|thur|thurs|fri|monday|tuesday|wednesday|thursday|friday|weekday|weeknight)s?\b/.test(
      s,
    );

  // If both kinds of days appear, treat as a recurring multi-day pattern
  // and pick weekday (more frequent slots in the routine grid).
  const isWeekend = weekendMention && !weekdayMention;

  const morningWord = /\b(morning|breakfast|early)\b/.test(s);
  const eveningWord =
    /\b(evening|night|nights|dinner|afternoon|late)\b/.test(s);

  // Explicit am / pm with a leading hour, e.g. "7pm", "6:30am".
  const amMatch = /\b(\d{1,2})(?::\d{2})?\s*am\b/.exec(s);
  const pmMatch = /\b(\d{1,2})(?::\d{2})?\s*pm\b/.exec(s);

  let morning = morningWord || !!amMatch;
  let evening = eveningWord || !!pmMatch;

  // pm 12 = noon (treat as afternoon → evening), pm 1–4 = afternoon
  // → evening. am 5–11 = morning. Edge case: 12am = midnight (skip).
  if (amMatch) {
    const hr = parseInt(amMatch[1], 10);
    if (hr >= 5 && hr <= 11) morning = true;
  }
  if (pmMatch) {
    const hr = parseInt(pmMatch[1], 10);
    if (hr === 12 || (hr >= 1 && hr <= 11)) evening = true;
  }

  // Bare numeric "10am" without leading word boundary was caught above.
  // We also accept "10–11am" and "10:30 AM" via the same regex.

  // Couldn't classify at all → bail so caller uses category default.
  if (!weekendMention && !weekdayMention && !morning && !evening) {
    return null;
  }

  // Time tiebreaker: if both morning and evening words appear, prefer
  // evening (gym/club sessions tend to be after work even if they
  // mention an am variant).
  const isMorning = morning && !evening;

  if (isWeekend) return isMorning ? "weekend_morning" : "weekend_evening";
  return isMorning ? "weekday_morning" : "weekday_evening";
}

export const SLOT_LABELS: Record<RoutineSlot, string> = {
  weekday_morning: "Weekday mornings",
  weekday_evening: "Weekday evenings",
  weekend_morning: "Weekend mornings",
  weekend_evening: "Weekend afternoons / evenings",
};

export const SLOT_ORDER: RoutineSlot[] = [
  "weekday_morning",
  "weekday_evening",
  "weekend_morning",
  "weekend_evening",
];
