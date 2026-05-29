export type SocialStyle = "introvert" | "ambivert" | "extrovert";
export type BudgetTier = "low" | "medium" | "high";
export type TaskCategory =
  | "essentials"
  | "community"
  | "hobby"
  | "routine"
  | "exploration";
export type TaskStatus = "pending" | "done" | "snoozed" | "dismissed";
export type Phase = "week_one" | "month_one" | "quarter_one";

// After a recurring or event task is marked done, the user picks whether
// it sticks. `keep` promotes the task into "Your routine" (anchors).
// `not_for_me` removes the task and any related items from future surfaces.
// `none` is the default — the user hasn't decided yet.
export type KeeperState = "none" | "keep" | "maybe" | "not_for_me";

// Day-offset boundaries for each phase. `label` keeps the time anchor
// ("Week 1"), `stage` is the behavioral framing ("Land & settle"). Both
// are displayed: the stage tells the user where they are in the journey,
// the label keeps the calendar legible.
export const PHASE_RANGES: Record<
  Phase,
  { start: number; end: number; label: string; stage: string; stageBlurb: string }
> = {
  week_one: {
    start: 0,
    end: 6,
    label: "Week 1",
    stage: "Land & settle",
    stageBlurb: "Get the basics in place so the rest of life can happen.",
  },
  month_one: {
    start: 7,
    end: 29,
    label: "Month 1",
    stage: "Try things",
    stageBlurb: "Explore widely. You're collecting data, not making commitments.",
  },
  quarter_one: {
    start: 30,
    end: 89,
    label: "Quarter 1",
    stage: "Your routine",
    stageBlurb: "What your week could look like, based on what you've kept.",
  },
};

export function phaseForDay(dayOffset: number): Phase {
  if (dayOffset <= PHASE_RANGES.week_one.end) return "week_one";
  if (dayOffset <= PHASE_RANGES.month_one.end) return "month_one";
  return "quarter_one";
}

export type SocialGoal =
  | "close_friends"
  | "dating"
  | "professional"
  | "acquaintances"
  | "community";

export type Availability =
  | "weekday_mornings"
  | "weekday_evenings"
  | "weekends"
  | "lunch_breaks";

export type Profile = {
  userId: string;
  displayName: string | null;
  city: string;
  // Optional neighborhood within the city. When set, AI surfaces
  // (e.g. Week 1 daily-shops) bias suggestions toward this neighborhood.
  neighborhood: string | null;
  moveDate: string;
  socialStyle: SocialStyle;
  hasCar: boolean;
  budgetTier: BudgetTier;
  interests: string[];
  goals: string[];
};

export type Plan = {
  id: string;
  userId: string;
  version: number;
  isActive: boolean;
  generatedAt: string;
};

export type Task = {
  id: string;
  planId: string;
  userId: string;
  category: TaskCategory;
  phase: Phase;
  title: string;
  description: string | null;
  dayOffset: number;
  linkUrl: string | null;
  status: TaskStatus;
  completedAt: string | null;
  orderIndex: number;
  isEventAttendance: boolean;
  isRecurringActivity: boolean;
  keeperState: KeeperState;
  // Source item id when the task was created from a recommendation
  // ("+ Add to plan" on a For You item). Null for standard plan tasks.
  // Used to dedup "+ Add to plan" clicks and detect "is this item already
  // in the user's plan?"
  sourceItemId: string | null;
  // Full source object captured at "Add to plan" time. For pre-move /
  // For You-derived tasks this is the ForYouItem the user clicked on —
  // letting the detail panel render the same rich content (long
  // description, links, meta) the user already saw. Null for standard
  // plan tasks.
  detailsJson: unknown | null;
  // User's profile city at the moment this task was added. Used by
  // Quarter 1 "Your routine" to hide anchors created under a previous
  // city when the user moves. Null for static starter tasks and rows
  // that pre-date this column (treated as "always show").
  createdCity: string | null;
};

export type BadgeCriteria =
  | { type: "tasks_completed"; count: number }
  | { type: "event_attendance"; count: number }
  | { type: "recurring_completed"; count: number }
  | { type: "completion_pct"; pct: number };

export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  criteria: BadgeCriteria;
};

export type UserBadge = {
  userId: string;
  badgeId: string;
  earnedAt: string;
};

// State of a For You item the user has pinned. `shortlist` is the default
// (parked for later), `going` is the active commitment (event tiles), `went`
// is the archive. Non-event tiles really only use `shortlist`; events use
// the full lifecycle.
export type SavedItemState = "shortlist" | "going" | "went";

export const INTEREST_TAGS = [
  "fitness",
  "running",
  "yoga",
  "climbing",
  "cycling",
  "hiking",
  "books",
  "music",
  "art",
  "cooking",
  "food",
  "coffee",
  "gaming",
  "tech",
  "volunteering",
  "faith",
  "languages",
  "photography",
  "dance",
  "nightlife",
] as const;

// High-level goals shown on the onboarding form. Stored on the profile as
// strings and read by the recommendation engine to steer suggestions.
export const GOAL_TAGS = [
  "Make new friends",
  "Find a community",
  "Grow professionally",
  "Explore the city",
  "Build healthy habits",
  "Pursue a hobby or creative passion",
  "Date and meet new people",
  "Give back / volunteer",
] as const;
