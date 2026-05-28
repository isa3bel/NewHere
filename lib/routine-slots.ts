// Maps each known starter anchor to a "time of day x weekday/weekend"
// slot — used by the "Your routine" section to synthesize a suggested
// weekly schedule from the user's kept anchors.
//
// When AI is wired up, this static map gets replaced by a server call
// that returns the same shape per anchor. The slot taxonomy stays the
// same so the UI doesn't need to change.

import type { TaskCategory } from "./types";

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

export function getRoutingForAnchor(
  title: string,
  category: TaskCategory,
): AnchorRouting {
  return ANCHOR_ROUTING[title] ?? CATEGORY_DEFAULT[category];
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
