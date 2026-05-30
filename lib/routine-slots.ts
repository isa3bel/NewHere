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
// Two signals: day class (weekend vs weekday) and time class (morning
// vs evening). Tiebreaker priority for ambiguous time:
//   1. Explicit semantic words ("brunch" / "dinner") win outright.
//   2. If both am and pm numeric hours appear (e.g. "open 6am–9pm"),
//      the FIRST mentioned time wins — schedules typically lead with
//      the activity's primary time.
//   3. Otherwise the present signal wins; if none, fall through to
//      category default at the caller.
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

  // Allow optional plurals — `\bmorning\b` doesn't match "mornings"
  // because the boundary requires a non-word char after the 'g'. This
  // was missing real-world AI output like "Regular mornings".
  const morningWord =
    /\b(mornings?|breakfasts?|brunches?|early|sunrises?|dawns?)\b/.test(s);
  const eveningWord =
    /\b(evenings?|nights?|dinners?|afternoons?|late|sunsets?)\b/.test(s);

  // Find every am/pm token in order so we know which one came first.
  const ampmRegex = /\b(\d{1,2})(?::\d{2})?\s*(am|pm)\b/g;
  let firstTimeIsAm: boolean | null = null;
  let morningHour = false;
  let eveningHour = false;
  let m: RegExpExecArray | null;
  while ((m = ampmRegex.exec(s)) !== null) {
    const hr = parseInt(m[1], 10);
    const isAm = m[2] === "am";
    if (firstTimeIsAm === null) firstTimeIsAm = isAm;
    if (isAm && hr >= 5 && hr <= 11) morningHour = true;
    if (!isAm && (hr === 12 || (hr >= 1 && hr <= 11))) eveningHour = true;
  }

  const morning = morningWord || morningHour;
  const evening = eveningWord || eveningHour;

  // Couldn't classify at all → bail so caller uses category default.
  if (!weekendMention && !weekdayMention && !morning && !evening) {
    return null;
  }

  let isMorning: boolean;
  if (morningWord && !eveningWord) {
    isMorning = true;
  } else if (eveningWord && !morningWord) {
    isMorning = false;
  } else if (morning && evening) {
    // Both am and pm hours appear (e.g. "open 6am–9pm"). First mention
    // typically describes when the activity starts.
    isMorning = firstTimeIsAm === true;
  } else {
    isMorning = morning && !evening;
  }

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

// ============================================================
// Day-of-week scheduling — for the 7-day suggested-week calendar.
// ============================================================
// Fully deterministic — no AI involved. Anchors with explicit days in
// their schedule string pin to that day (rotating between them when
// the user reshuffles). Vague schedules fall back to slot-based
// defaults (weekend slot → Sat/Sun, weekday slot → Mon-Fri).

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEK_DAYS: WeekDay[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const WEEK_DAY_LABELS: Record<WeekDay, { short: string; long: string }> = {
  mon: { short: "Mon", long: "Monday" },
  tue: { short: "Tue", long: "Tuesday" },
  wed: { short: "Wed", long: "Wednesday" },
  thu: { short: "Thu", long: "Thursday" },
  fri: { short: "Fri", long: "Friday" },
  sat: { short: "Sat", long: "Saturday" },
  sun: { short: "Sun", long: "Sunday" },
};

const WEEKDAYS: WeekDay[] = ["mon", "tue", "wed", "thu", "fri"];
const WEEKEND_DAYS: WeekDay[] = ["sat", "sun"];

// Find every day-of-week mentioned in a schedule string. Returns days
// in chronological order (mon → sun) regardless of how they appeared
// in the text, so the shuffle rotation is predictable.
export function parseExplicitDays(text: string): WeekDay[] {
  if (!text) return [];
  const s = text.toLowerCase();
  const days: WeekDay[] = [];
  if (/\bmon(?:day)?s?\b/.test(s)) days.push("mon");
  if (/\btue(?:s|sday)?s?\b/.test(s)) days.push("tue");
  if (/\bwed(?:nesday)?s?\b/.test(s)) days.push("wed");
  if (/\bthu(?:r|rs|rsday)?s?\b/.test(s)) days.push("thu");
  if (/\bfri(?:day)?s?\b/.test(s)) days.push("fri");
  if (/\bsat(?:urday)?s?\b/.test(s)) days.push("sat");
  if (/\bsun(?:day)?s?\b/.test(s)) days.push("sun");
  return days;
}

// Picks the day this anchor should show up on in the suggested-week
// calendar. Seed-driven so the global "Reshuffle" button can rotate
// anchors with multiple legitimate days. Anchors with one explicit
// day always stay put.
export function pickDayForAnchor(
  slot: RoutineSlot,
  schedule: string | undefined,
  seed: number,
): WeekDay {
  return getDayCandidatesForAnchor(slot, schedule, seed)[0];
}

// Ordered list of days the anchor can legitimately occupy, most
// preferred first. Used by the per-day cap logic — if the preferred
// day is full, the caller walks to the next candidate. Seed rotates
// the order so reshuffle moves multi-day anchors between their valid
// options.
//
// - Explicit days from the schedule are the only candidates when
//   present ("Tuesdays 7pm" → [tue], no flexibility).
// - Multi-day anchors ("Mon/Wed/Fri") rotate through their days.
// - Vague anchors fall back to all weekdays or all weekend days.
export function getDayCandidatesForAnchor(
  slot: RoutineSlot,
  schedule: string | undefined,
  seed: number,
): WeekDay[] {
  const explicit = parseExplicitDays(schedule ?? "");
  if (explicit.length > 0) {
    return rotateBySeed(explicit, seed);
  }
  const fallback =
    slot === "weekend_morning" || slot === "weekend_evening"
      ? WEEKEND_DAYS
      : WEEKDAYS;
  return rotateBySeed([...fallback], seed);
}

function rotateBySeed<T>(arr: T[], seed: number): T[] {
  if (arr.length === 0) return arr;
  const offset = Math.abs(seed) % arr.length;
  return [...arr.slice(offset), ...arr.slice(0, offset)];
}

// Stable per-anchor seed offset so each anchor shuffles independently
// when the global counter bumps. Tiny polynomial rolling hash.
export function hashAnchorId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return h;
}

// Sort key for within-day ordering: morning before evening.
export function slotSortKey(slot: RoutineSlot): number {
  switch (slot) {
    case "weekday_morning":
    case "weekend_morning":
      return 0;
    case "weekday_evening":
    case "weekend_evening":
      return 1;
  }
}
