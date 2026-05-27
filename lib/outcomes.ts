// Maps each onboarding goal to a concrete, observable outcome the user
// should have by the end of the 90-day plan. Used to re-anchor the plan
// page around what the user will *have*, not just what they've checked off.

type Outcome = {
  icon: string;
  headline: string;
  detail: string;
};

const GOAL_OUTCOMES: Record<string, Outcome> = {
  "Make new friends": {
    icon: "💬",
    headline: "3 people you can text on a whim",
    detail: "Not a network — actual people who'll meet for coffee.",
  },
  "Find a community": {
    icon: "🪴",
    headline: "1 weekly anchor where the regulars know your face",
    detail: "Run club, studio, board game night — somewhere you reliably show up.",
  },
  "Grow professionally": {
    icon: "💼",
    headline: "2 industry contacts in your new city",
    detail: "People you'd grab lunch with or message about a problem.",
  },
  "Explore the city": {
    icon: "🗺️",
    headline: "5 neighborhoods you actually know",
    detail: "Past the tourist map — places you've eaten, walked, lingered.",
  },
  "Build healthy habits": {
    icon: "🌿",
    headline: "1 recurring activity you've stuck with for a month",
    detail: "Same time, same place, no negotiation with yourself.",
  },
  "Pursue a hobby or creative passion": {
    icon: "🎯",
    headline: "1 skill you've practiced 4+ times in a real setting",
    detail: "Class, group, studio — not alone in your apartment.",
  },
  "Date and meet new people": {
    icon: "✨",
    headline: "1 ongoing connection from a new context",
    detail: "Met somewhere real, kept in touch beyond the first hello.",
  },
  "Give back / volunteer": {
    icon: "🤝",
    headline: "1 recurring volunteer commitment",
    detail: "A place that expects you, and a few people who'll notice if you don't show.",
  },
};

const DEFAULT_OUTCOME: Outcome = {
  icon: "🌳",
  headline: "A life here that feels like yours",
  detail: "Routines, faces, and places you'd choose again.",
};

// Returns up to 3 outcomes drawn from the user's stated goals, in
// the order they selected them. Falls back to a generic outcome if
// they didn't pick any.
export function outcomesForGoals(goals: string[]): Outcome[] {
  const matched = goals
    .map((g) => GOAL_OUTCOMES[g])
    .filter((o): o is Outcome => Boolean(o));
  if (matched.length === 0) return [DEFAULT_OUTCOME];
  return matched.slice(0, 3);
}
