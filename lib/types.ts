export type SocialEnergy = "low" | "medium" | "high";
export type BudgetTier = "low" | "medium" | "high";
export type TaskCategory = "community" | "hobby" | "routine" | "exploration";
export type TaskStatus = "pending" | "done" | "snoozed" | "dismissed";

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
  moveDate: string;
  socialEnergy: SocialEnergy;
  hasCar: boolean;
  budgetTier: BudgetTier;
  interests: string[];
  priorities: string[];
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
  title: string;
  description: string | null;
  dayOffset: number;
  linkUrl: string | null;
  status: TaskStatus;
  completedAt: string | null;
  orderIndex: number;
  isEventAttendance: boolean;
  isRecurringActivity: boolean;
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

export const PRIORITY_TAGS = [
  "community",
  "fitness",
  "creative",
  "professional",
  "spiritual",
  "volunteer",
] as const;
