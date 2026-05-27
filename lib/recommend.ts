import type {
  Availability,
  BudgetTier,
  Phase,
  SocialGoal,
  SocialStyle,
  TaskCategory,
} from "./types";

// ============================================================
// Public types — what callers pass in and get back
// ============================================================

export type RecommendationInput = {
  city: string;
  interests: string[];
  socialGoals: SocialGoal[];
  weeklyHours: number;
  budgetTier: BudgetTier;
  socialStyle: SocialStyle;
  availability: Availability[];
};

export type RecommendedAction = {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  phase: Phase;
  estMinutes: number;
  costTier: BudgetTier;
  linkUrl?: string;
};

export type SearchPhrase = {
  platform:
    | "meetup"
    | "eventbrite"
    | "reddit"
    | "google"
    | "facebook"
    | "library"
    | "parks"
    | "volunteer";
  label: string;
  phrase: string;
  url: string;
};

export type Recommendations = {
  city: string;
  // Three phases — see PRD acceptance criterion #2
  weekOneActions: RecommendedAction[];      // >= 5, days 0-6
  monthOneActions: RecommendedAction[];     // >= 8, days 7-29
  quarterOneActions: RecommendedAction[];   // >= 8, days 30-89
  weeklyRoutine: {
    title: string;
    description: string;
    suggestedDay: string;
  };
  stretchChallenge: {
    title: string;
    description: string;
  };
  searchPhrases: SearchPhrase[];
};

// ============================================================
// Action template catalog — the rules engine's data
// ============================================================

type TemplateTag =
  | "first_week"   // low-friction; safe for week 1
  | "social"       // requires showing up around other people
  | "active"       // physical / hobby engagement
  | "anchor";      // becomes recurring

type Template = {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  tags: TemplateTag[];
  estMinutes: number;
  costTier: BudgetTier;
  // Phase the template fits best in. If omitted, derived from tags:
  // "first_week" tag -> week_one, otherwise month_one.
  phase?: Phase;
  // Eligibility — all defined fields must pass
  requiresAnyInterest?: string[];
  requiresAnyGoal?: SocialGoal[];
  minStyle?: SocialStyle;       // user style must be at least this outgoing
  maxCostForBudget?: BudgetTier;  // template cost must be <= user budget
  linkTemplate?: string;          // {{interest}} and {{city}} substituted
  // Scoring boost
  baseScore: number;
};

function phaseFor(t: Template): Phase {
  if (t.phase) return t.phase;
  if (t.tags.includes("first_week")) return "week_one";
  return "month_one";
}

const TEMPLATES: Template[] = [
  // -------- First-week anchors (no social commitment) --------
  {
    id: "walk_neighborhood",
    title: "Walk every street within 4 blocks of home",
    description: "Map your neighborhood with your feet. Notice the coffee shops, parks, and stores along the way.",
    category: "exploration",
    tags: ["first_week"],
    estMinutes: 60,
    costTier: "low",
    baseScore: 10,
  },
  {
    id: "anchor_coffee",
    title: "Find a coffee shop you can become a regular at",
    description: "Pick one within walking distance and go twice this week. Familiarity is the start of community.",
    category: "community",
    tags: ["first_week", "anchor"],
    estMinutes: 60,
    costTier: "low",
    baseScore: 9,
  },
  {
    id: "unpack_daily",
    title: "Unpack one box every day this week",
    description: "Small daily wins beat one exhausting weekend.",
    category: "routine",
    tags: ["first_week"],
    estMinutes: 30,
    costTier: "low",
    baseScore: 8,
  },
  {
    id: "essentials_map",
    title: "Map your nearest grocery, pharmacy, and transit stop",
    description: "Knowing the basics within a 10-minute walk lowers your daily friction by a lot.",
    category: "routine",
    tags: ["first_week"],
    estMinutes: 45,
    costTier: "low",
    baseScore: 8,
  },
  {
    id: "different_neighborhood_walk",
    title: "Take a no-plan walk in a different neighborhood",
    description: "Pick a part of town you don't live in. Wander without a destination for at least an hour.",
    category: "exploration",
    tags: ["first_week"],
    estMinutes: 90,
    costTier: "low",
    baseScore: 6,
  },

  // -------- Routine / anchor (recurring) --------
  {
    id: "grocery_routine",
    title: "Establish a weekly grocery run",
    description: "Pick a day and store. Consistency builds neighborhood familiarity.",
    category: "routine",
    tags: ["anchor"],
    estMinutes: 60,
    costTier: "low",
    baseScore: 7,
  },
  {
    id: "weekly_anchor",
    title: "Set up a recurring weekly anchor",
    description: "Same time, same place every week — a class, run club, trivia night, anything that repeats.",
    category: "routine",
    tags: ["anchor"],
    estMinutes: 90,
    costTier: "low",
    baseScore: 9,
  },

  // -------- Hobby — interest-gated --------
  {
    id: "climbing_gym",
    title: "Visit a local climbing gym for a day pass",
    description: "Talk to the front desk about beginner sessions and weekly meetups.",
    category: "hobby",
    tags: ["active"],
    estMinutes: 120,
    costTier: "medium",
    requiresAnyInterest: ["climbing"],
    linkTemplate: "https://www.google.com/maps/search/climbing+gym+{{city}}",
    baseScore: 8,
  },
  {
    id: "running_club",
    title: "Join a free local running club",
    description: "Most cities have a free weekly group run — find yours and show up once.",
    category: "community",
    tags: ["social", "active", "anchor"],
    estMinutes: 75,
    costTier: "low",
    requiresAnyInterest: ["running", "fitness"],
    linkTemplate: "https://www.google.com/search?q={{interest}}+club+{{city}}",
    baseScore: 8,
  },
  {
    id: "yoga_studio",
    title: "Try three different yoga studios in your first month",
    description: "Most offer intro deals. Find the one whose vibe and schedule fit you.",
    category: "hobby",
    tags: ["active", "anchor"],
    estMinutes: 75,
    costTier: "medium",
    requiresAnyInterest: ["yoga", "fitness"],
    baseScore: 7,
  },
  {
    id: "cycling_route",
    title: "Find a regular cycling route or group ride",
    description: "Search local bike shops for group ride schedules — they're usually free.",
    category: "hobby",
    tags: ["active", "anchor"],
    estMinutes: 120,
    costTier: "low",
    requiresAnyInterest: ["cycling"],
    baseScore: 7,
  },
  {
    id: "hiking_trail",
    title: "Hike a trail within 30 minutes of home",
    description: "Search AllTrails for nearby beginner-to-intermediate routes and pick one this weekend.",
    category: "exploration",
    tags: ["active"],
    estMinutes: 180,
    costTier: "low",
    requiresAnyInterest: ["hiking"],
    linkTemplate: "https://www.alltrails.com/search?location={{city}}",
    baseScore: 7,
  },
  {
    id: "bookstore_newsletter",
    title: "Visit a local indie bookstore and sign up for their events newsletter",
    description: "Author readings and book clubs are some of the easiest low-stakes social entry points.",
    category: "hobby",
    tags: ["active"],
    estMinutes: 60,
    costTier: "low",
    requiresAnyInterest: ["books"],
    baseScore: 7,
  },
  {
    id: "book_club",
    title: "Find or start a book club",
    description: "Search Meetup or your local library. Reading something together is an easy recurring excuse to gather.",
    category: "community",
    tags: ["social", "anchor"],
    estMinutes: 90,
    costTier: "low",
    requiresAnyInterest: ["books"],
    linkTemplate: "https://www.meetup.com/find/?keywords=book+club&location={{city}}",
    baseScore: 7,
  },
  {
    id: "art_class",
    title: "Commit to a multi-week art or pottery class",
    description: "Classes give you both a skill and a fresh recurring group of people.",
    category: "hobby",
    tags: ["social", "active"],
    estMinutes: 120,
    costTier: "medium",
    phase: "quarter_one",
    requiresAnyInterest: ["art"],
    baseScore: 6,
  },
  {
    id: "cooking_class",
    title: "Take a cooking class on a cuisine you love",
    description: "Hands-on, social, and you eat well at the end.",
    category: "hobby",
    tags: ["social", "active"],
    estMinutes: 150,
    costTier: "medium",
    phase: "quarter_one",
    requiresAnyInterest: ["cooking", "food"],
    baseScore: 6,
  },
  {
    id: "music_venue",
    title: "See a show at a small local music venue",
    description: "Pick a venue, not a specific band — finding the venues you like is half the discovery.",
    category: "exploration",
    tags: ["social"],
    estMinutes: 180,
    costTier: "medium",
    requiresAnyInterest: ["music"],
    baseScore: 6,
  },
  {
    id: "photo_walk",
    title: "Join a photo walk",
    description: "Search Meetup or Facebook for local photo walks — low-pressure, parallel-play social.",
    category: "hobby",
    tags: ["social", "active"],
    estMinutes: 120,
    costTier: "low",
    requiresAnyInterest: ["photography"],
    linkTemplate: "https://www.meetup.com/find/?keywords=photo+walk&location={{city}}",
    baseScore: 6,
  },
  {
    id: "dance_class",
    title: "Take a beginner dance class series",
    description: "Salsa, swing, contra — most beginner series don't require a partner. Commit to 4 weeks.",
    category: "hobby",
    tags: ["social", "active"],
    estMinutes: 90,
    costTier: "medium",
    phase: "quarter_one",
    requiresAnyInterest: ["dance"],
    baseScore: 6,
  },
  {
    id: "language_meetup",
    title: "Find a language exchange meetup",
    description: "Even casual conversation hours are surprisingly easy ways to meet people.",
    category: "community",
    tags: ["social", "anchor"],
    estMinutes: 90,
    costTier: "low",
    requiresAnyInterest: ["languages"],
    linkTemplate: "https://www.meetup.com/find/?keywords=language+exchange&location={{city}}",
    baseScore: 6,
  },

  // -------- Community — goal-gated --------
  {
    id: "meetup_rsvp",
    title: "RSVP to a Meetup event in the next two weeks",
    description: "Just one. Stay at least 45 minutes. Talk to two people.",
    category: "community",
    tags: ["social"],
    estMinutes: 120,
    costTier: "low",
    requiresAnyGoal: ["close_friends", "acquaintances", "community"],
    linkTemplate: "https://www.meetup.com/find/?location={{city}}",
    baseScore: 9,
  },
  {
    id: "meetup_return",
    title: "Go to a recurring Meetup event a second time",
    description: "Familiar faces start to recognize you on visit #2. That's where connection actually starts.",
    category: "community",
    tags: ["social"],
    estMinutes: 120,
    costTier: "low",
    phase: "quarter_one",
    requiresAnyGoal: ["close_friends", "community"],
    baseScore: 8,
  },
  {
    id: "free_city_event",
    title: "Attend one free city event this month",
    description: "Outdoor concerts, farmers markets, gallery openings — your city's events calendar is full of them.",
    category: "exploration",
    tags: ["social"],
    estMinutes: 120,
    costTier: "low",
    baseScore: 6,
  },
  {
    id: "invite_one",
    title: "Invite one acquaintance to do something",
    description: "Coffee, a walk, anything. The ask itself is the work.",
    category: "community",
    tags: ["social"],
    estMinutes: 90,
    costTier: "low",
    phase: "quarter_one",
    requiresAnyGoal: ["close_friends", "dating"],
    baseScore: 7,
  },
  {
    id: "volunteer_local",
    title: "Volunteer at a local organization",
    description: "Volunteering is one of the highest-density ways to meet engaged locals.",
    category: "community",
    tags: ["social", "anchor"],
    estMinutes: 180,
    costTier: "low",
    requiresAnyInterest: ["volunteering"],
    linkTemplate: "https://www.volunteermatch.org/search/?l={{city}}",
    baseScore: 7,
  },
  {
    id: "professional_meetup",
    title: "Attend a professional or industry meetup",
    description: "Look for monthly socials — they're typically lower-key than conferences and easier to talk at.",
    category: "community",
    tags: ["social"],
    estMinutes: 120,
    costTier: "low",
    requiresAnyGoal: ["professional"],
    linkTemplate: "https://www.meetup.com/find/?keywords=professional&location={{city}}",
    baseScore: 7,
  },
  {
    id: "faith_community",
    title: "Visit a faith or spiritual community gathering",
    description: "Most welcome newcomers and have weekly rhythms that quickly turn into recurring connection.",
    category: "community",
    tags: ["social", "anchor"],
    estMinutes: 120,
    costTier: "low",
    requiresAnyInterest: ["faith"],
    baseScore: 6,
  },
  {
    id: "rec_sports",
    title: "Sign up for a recreational sports league",
    description: "Kickball, dodgeball, soccer — most cities have adult leagues that accept solo signups and place you on a team.",
    category: "community",
    tags: ["social", "active", "anchor"],
    estMinutes: 120,
    costTier: "medium",
    phase: "quarter_one",
    requiresAnyInterest: ["fitness", "running", "cycling"],
    requiresAnyGoal: ["close_friends", "acquaintances", "community"],
    baseScore: 7,
  },

  // -------- Exploration --------
  {
    id: "different_restaurant",
    title: "Eat at a restaurant from a cuisine you haven't tried before",
    description: "Pick something you wouldn't have ordered back home.",
    category: "exploration",
    tags: [],
    estMinutes: 90,
    costTier: "medium",
    baseScore: 5,
  },
  {
    id: "day_trip",
    title: "Take a day trip somewhere within an hour",
    description: "Get a feel for what's nearby beyond the city itself.",
    category: "exploration",
    tags: [],
    estMinutes: 360,
    costTier: "medium",
    phase: "quarter_one",
    baseScore: 5,
  },
  {
    id: "free_museum",
    title: "Visit a free museum or gallery",
    description: "Many museums have free days. Look up the schedule for yours.",
    category: "exploration",
    tags: [],
    estMinutes: 120,
    costTier: "low",
    baseScore: 5,
  },
  {
    id: "farmers_market",
    title: "Go to your nearest farmers market on Saturday morning",
    description: "Free, social-adjacent, and a great recurring weekend anchor.",
    category: "exploration",
    tags: ["anchor"],
    estMinutes: 90,
    costTier: "low",
    baseScore: 6,
  },
  {
    id: "park_visit",
    title: "Spend a Sunday in your biggest local park",
    description: "Bring a book or a friend. Notice what people do there — it tells you a lot about the city.",
    category: "exploration",
    tags: [],
    estMinutes: 180,
    costTier: "low",
    baseScore: 5,
  },
  {
    id: "month_review",
    title: "Review your month and pick one anchor to keep",
    description: "One repeatable thing is the start of a life here.",
    category: "routine",
    tags: ["anchor"],
    estMinutes: 30,
    costTier: "low",
    phase: "quarter_one",
    baseScore: 6,
  },

  // -------- Additional Quarter 1 templates (deeper commitment) --------
  {
    id: "host_gathering",
    title: "Host a small gathering of 3–5 people you've met",
    description: "Coffee, board games, a walk — low-stakes format. The host role gives you a reason to invite people you've only met once.",
    category: "community",
    tags: ["social"],
    estMinutes: 180,
    costTier: "medium",
    phase: "quarter_one",
    requiresAnyGoal: ["close_friends", "community"],
    baseScore: 7,
  },
  {
    id: "third_place",
    title: "Identify your 'third place' — somewhere weekly that isn't home or work",
    description: "Library, gym, or coffee shop you visit every week. By month 3, the staff should know your face.",
    category: "routine",
    tags: ["anchor"],
    estMinutes: 60,
    costTier: "low",
    phase: "quarter_one",
    baseScore: 7,
  },
  {
    id: "weekend_trip",
    title: "Take a weekend trip to somewhere within 3 hours",
    description: "Get out of the city for two days. You'll come back understanding home better.",
    category: "exploration",
    tags: [],
    estMinutes: 1800,
    costTier: "medium",
    phase: "quarter_one",
    baseScore: 5,
  },
  {
    id: "new_neighborhood_visit",
    title: "Visit a neighborhood you've never been to",
    description: "Eat lunch there. Walk for an hour. Notice what's different from your own.",
    category: "exploration",
    tags: [],
    estMinutes: 180,
    costTier: "low",
    phase: "quarter_one",
    baseScore: 5,
  },
  {
    id: "regular_partner",
    title: "Find a regular running, hiking, or workout partner",
    description: "Someone who'll text you when they're going — accountability turns intent into habit.",
    category: "hobby",
    tags: ["social", "active", "anchor"],
    estMinutes: 90,
    costTier: "low",
    phase: "quarter_one",
    requiresAnyInterest: ["running", "fitness", "hiking", "cycling", "yoga"],
    baseScore: 7,
  },
];

// ============================================================
// Scoring + selection
// ============================================================

// 0 = most introverted, 2 = most extroverted
const STYLE_ORDER: Record<SocialStyle, number> = {
  introvert: 0,
  ambivert: 1,
  extrovert: 2,
};
const BUDGET_ORDER: Record<BudgetTier, number> = { low: 0, medium: 1, high: 2 };

function isEligible(t: Template, input: RecommendationInput): boolean {
  if (
    t.requiresAnyInterest &&
    !t.requiresAnyInterest.some((i) => input.interests.includes(i))
  ) {
    return false;
  }
  if (
    t.requiresAnyGoal &&
    !t.requiresAnyGoal.some((g) => input.socialGoals.includes(g))
  ) {
    return false;
  }
  if (
    t.minStyle &&
    STYLE_ORDER[input.socialStyle] < STYLE_ORDER[t.minStyle]
  ) {
    return false;
  }
  if (BUDGET_ORDER[t.costTier] > BUDGET_ORDER[input.budgetTier]) {
    return false;
  }
  return true;
}

function fitScore(t: Template, input: RecommendationInput): number {
  let score = t.baseScore;

  // Interest overlap — each matched interest adds to the score
  if (t.requiresAnyInterest) {
    const matches = t.requiresAnyInterest.filter((i) =>
      input.interests.includes(i),
    ).length;
    score += matches * 2;
  }
  // Goal overlap
  if (t.requiresAnyGoal) {
    const matches = t.requiresAnyGoal.filter((g) =>
      input.socialGoals.includes(g),
    ).length;
    score += matches * 2;
  }

  // Style alignment: introverts get a bonus on solo/individual actions;
  // extroverts get a bonus on social ones. Ambiverts sit in the middle.
  const styleN = STYLE_ORDER[input.socialStyle];
  if (t.tags.includes("social")) {
    score += styleN === 2 ? 3 : styleN === 1 ? 1 : -2;
  } else {
    score += styleN === 0 ? 2 : styleN === 1 ? 1 : 0;
  }

  // Weekly time fit: penalize templates that exceed weekly time budget
  const weeklyMinutes = Math.max(0, input.weeklyHours) * 60;
  if (t.estMinutes > weeklyMinutes) score -= 4;

  // Availability heuristic: weekday-evening users get a boost on shorter actions;
  // weekend users get a boost on longer ones
  if (
    input.availability.includes("weekday_evenings") &&
    t.estMinutes <= 120
  ) {
    score += 1;
  }
  if (input.availability.includes("weekends") && t.estMinutes >= 120) {
    score += 1;
  }

  return score;
}

function renderTemplate(
  t: Template,
  input: RecommendationInput,
): RecommendedAction {
  const interest = t.requiresAnyInterest?.find((i) =>
    input.interests.includes(i),
  );
  const linkUrl = t.linkTemplate
    ?.replaceAll("{{city}}", encodeURIComponent(input.city))
    .replaceAll("{{interest}}", encodeURIComponent(interest ?? ""));
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    phase: phaseFor(t),
    estMinutes: t.estMinutes,
    costTier: t.costTier,
    linkUrl,
  };
}

// ============================================================
// Weekly routine + stretch challenge selection
// ============================================================

function pickWeeklyRoutine(input: RecommendationInput): Recommendations["weeklyRoutine"] {
  const suggestedDay = input.availability.includes("weekends")
    ? "Saturday morning"
    : input.availability.includes("weekday_evenings")
      ? "Tuesday evening"
      : input.availability.includes("weekday_mornings")
        ? "Wednesday morning"
        : "Sunday afternoon";

  if (input.interests.includes("running") || input.interests.includes("fitness")) {
    return {
      title: "Weekly group run",
      description: "Same route, same time, same group. Build the muscle of just showing up — that's where familiarity becomes friendship.",
      suggestedDay,
    };
  }
  if (input.interests.includes("books")) {
    return {
      title: "Weekly bookstore-or-library visit",
      description: "Same place, same time. Get to know the regulars, the staff, and what's on the events calendar.",
      suggestedDay,
    };
  }
  if (input.interests.includes("yoga")) {
    return {
      title: "Weekly yoga class at the same studio",
      description: "Recurring class with the same teacher is one of the fastest ways to build a familiar face network.",
      suggestedDay,
    };
  }
  if (input.interests.includes("volunteering")) {
    return {
      title: "Weekly volunteer shift",
      description: "Find one shift you can commit to every week. Volunteers see each other constantly — connection compounds.",
      suggestedDay,
    };
  }
  return {
    title: "Weekly anchor coffee",
    description: "Same coffee shop, same time, every week. Bring a book or a notebook. By week three, the staff knows your order.",
    suggestedDay,
  };
}

function pickStretchChallenge(
  input: RecommendationInput,
): Recommendations["stretchChallenge"] {
  const style = STYLE_ORDER[input.socialStyle];
  if (style >= 2) {
    return {
      title: "Host a small gathering of 4 new acquaintances",
      description: "Pick a low-stakes format — coffee, board games, a walk. The host role gives you a reason to invite people you've only met once.",
    };
  }
  if (style === 1) {
    return {
      title: "Say yes to every invitation for one full week",
      description: "Even the awkward ones. The point isn't fun — it's resetting your default response and building social momentum.",
    };
  }
  return {
    title: "Have a real conversation with one stranger this week",
    description: "Barista, neighbor, gym regular, fellow Meetup attendee. Past small talk, into one specific question. Just one.",
  };
}

// ============================================================
// Search phrases — varied platforms based on top interests
// ============================================================

function pickSearchPhrases(input: RecommendationInput): SearchPhrase[] {
  const city = input.city;
  const cityEnc = encodeURIComponent(city);
  const topInterest = input.interests[0] ?? "community";
  const secondInterest = input.interests[1] ?? "events";

  const candidates: SearchPhrase[] = [
    {
      platform: "meetup",
      label: "Meetup groups",
      phrase: `${topInterest} meetup ${city}`,
      url: `https://www.meetup.com/find/?keywords=${encodeURIComponent(topInterest)}&location=${cityEnc}`,
    },
    {
      platform: "eventbrite",
      label: "Eventbrite events",
      phrase: `${secondInterest} ${city}`,
      url: `https://www.eventbrite.com/d/${cityEnc}/${encodeURIComponent(secondInterest)}/`,
    },
    {
      platform: "reddit",
      label: "Reddit — new to town",
      phrase: `r/${city.split(",")[0].toLowerCase().replace(/\s+/g, "")} new to town tips for meeting people`,
      url: `https://www.reddit.com/search/?q=${encodeURIComponent(`new to ${city} meet people`)}`,
    },
    {
      platform: "facebook",
      label: "Facebook Groups",
      phrase: `${topInterest} group ${city}`,
      url: `https://www.facebook.com/search/groups/?q=${encodeURIComponent(`${topInterest} ${city}`)}`,
    },
    {
      platform: "library",
      label: "Public library events",
      phrase: `${city} public library events calendar`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`${city} public library events`)}`,
    },
    {
      platform: "parks",
      label: "Parks & Rec classes",
      phrase: `${city} parks and recreation adult classes`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`${city} parks and recreation adult classes`)}`,
    },
    {
      platform: "volunteer",
      label: "Volunteer opportunities",
      phrase: `volunteer opportunities ${city}`,
      url: `https://www.volunteermatch.org/search/?l=${cityEnc}`,
    },
    {
      platform: "google",
      label: "Google — beginner-friendly classes",
      phrase: `beginner ${topInterest} class ${city}`,
      url: `https://www.google.com/search?q=${encodeURIComponent(`beginner ${topInterest} class ${city}`)}`,
    },
  ];

  // Tailor selection to the user's goals/interests
  const scored = candidates.map((c) => {
    let score = 0;
    if (input.socialGoals.includes("community") && c.platform === "meetup") score += 2;
    if (input.socialGoals.includes("professional") && c.platform === "eventbrite") score += 2;
    if (input.interests.includes("volunteering") && c.platform === "volunteer") score += 3;
    if (input.interests.includes("books") && c.platform === "library") score += 3;
    if (
      (input.interests.includes("fitness") ||
        input.interests.includes("running") ||
        input.interests.includes("cycling")) &&
      c.platform === "parks"
    ) {
      score += 2;
    }
    return { c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // Always include at least Meetup, Reddit, and one local-civic (library/parks/volunteer)
  const picks: SearchPhrase[] = [];
  const used = new Set<string>();
  const mustInclude = ["meetup", "reddit"];
  for (const m of mustInclude) {
    const hit = candidates.find((c) => c.platform === m);
    if (hit && !used.has(hit.platform)) {
      picks.push(hit);
      used.add(hit.platform);
    }
  }
  for (const { c } of scored) {
    if (picks.length >= 5) break;
    if (used.has(c.platform)) continue;
    picks.push(c);
    used.add(c.platform);
  }
  return picks.slice(0, 5);
}

// ============================================================
// Main entry point
// ============================================================

// Minimums from PRD acceptance criterion #2
const PHASE_TARGETS: Record<Phase, number> = {
  week_one: 5,
  month_one: 8,
  quarter_one: 8,
};

type Scored = { t: Template; score: number };

function pickForPhase(
  phase: Phase,
  primaryPool: Scored[],
  spilloverPool: Scored[],
  alreadyPicked: Set<string>,
  input: RecommendationInput,
): RecommendedAction[] {
  const target = PHASE_TARGETS[phase];
  const picks: RecommendedAction[] = [];
  // Soft cap of ~half the target per category to keep diversity
  const cap = Math.max(2, Math.ceil(target / 2));
  const categoryCounts: Record<TaskCategory, number> = {
    essentials: 0,
    community: 0,
    hobby: 0,
    routine: 0,
    exploration: 0,
  };

  const tryAdd = (s: Scored, respectCategoryCap: boolean) => {
    if (picks.length >= target) return;
    if (alreadyPicked.has(s.t.id)) return;
    if (respectCategoryCap && categoryCounts[s.t.category] >= cap) return;
    picks.push(renderTemplate(s.t, input));
    alreadyPicked.add(s.t.id);
    categoryCounts[s.t.category] += 1;
  };

  for (const s of primaryPool) tryAdd(s, true);
  // If the primary pool didn't fill the target, drop the diversity cap
  for (const s of primaryPool) tryAdd(s, false);
  // Still short? spill over from adjacent phases (only if we genuinely can't hit the minimum)
  for (const s of spilloverPool) tryAdd(s, false);

  return picks;
}

export function generateRecommendations(
  input: RecommendationInput,
): Recommendations {
  const eligible = TEMPLATES.filter((t) => isEligible(t, input));
  const scored: Scored[] = eligible
    .map((t) => ({ t, score: fitScore(t, input) }))
    .sort((a, b) => b.score - a.score);

  const buckets: Record<Phase, Scored[]> = {
    week_one: [],
    month_one: [],
    quarter_one: [],
  };
  for (const s of scored) buckets[phaseFor(s.t)].push(s);

  const picked = new Set<string>();

  // Pick in order so each phase prefers its own pool first.
  // Spillover order: week_one borrows from month_one if short; month_one and
  // quarter_one borrow from each other.
  const weekOneActions = pickForPhase(
    "week_one",
    buckets.week_one,
    buckets.month_one,
    picked,
    input,
  );
  const monthOneActions = pickForPhase(
    "month_one",
    buckets.month_one,
    buckets.quarter_one,
    picked,
    input,
  );
  const quarterOneActions = pickForPhase(
    "quarter_one",
    buckets.quarter_one,
    buckets.month_one,
    picked,
    input,
  );

  return {
    city: input.city,
    weekOneActions,
    monthOneActions,
    quarterOneActions,
    weeklyRoutine: pickWeeklyRoutine(input),
    stretchChallenge: pickStretchChallenge(input),
    searchPhrases: pickSearchPhrases(input),
  };
}
