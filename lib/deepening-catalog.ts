import type { TaskCategory } from "./types";

// Static catalog of "deepening" tasks for each known Month 1 starter anchor.
// When a user marks one of these tasks as Keep, we insert these templates
// into their Quarter 1 plan — turning their kept anchor into 2–3 concrete
// next-level commitments.
//
// Keyed by task TITLE (not id) because once we move to Supabase, the task
// id is a UUID generated at insert time. The title is the only stable
// identifier we control across the dev mock + production db.
//
// When AI + web search is wired up, getDeepeningTemplates() becomes a
// server call ("given this anchor + the user's city, return 2–3 deepening
// steps as JSON"). The result is persisted exactly the same way — so the
// AI cost is bounded by "number of new anchors a user keeps," not by
// page-view frequency.

export type DeepeningTemplate = {
  title: string;
  description: string;
  category: TaskCategory;
  dayOffset: number;
  isEventAttendance: boolean;
  isRecurringActivity: boolean;
};

const CATALOG: Record<string, DeepeningTemplate[]> = {
  "Find a coffee shop you can become a regular at": [
    {
      title: "Attend a public cupping at your shop",
      description:
        "Most specialty roasters host free or low-cost cuppings monthly — you taste 4–6 origins side by side and the staff walks you through it.",
      category: "exploration",
      dayOffset: 35,
      isEventAttendance: true,
      isRecurringActivity: false,
    },
    {
      title: "Get to know one regular or barista by name",
      description:
        "By visit 4–5, recognize someone and say hi. The third place gets sticky the moment you actually know someone there.",
      category: "community",
      dayOffset: 40,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
    {
      title: "Try a different drink each visit for a month",
      description:
        "Your barista will learn your taste and start suggesting things. Builds the relationship + your palate.",
      category: "hobby",
      dayOffset: 50,
      isEventAttendance: false,
      isRecurringActivity: true,
    },
  ],

  "Establish a weekly grocery run": [
    {
      title: "Try meal prepping one Sunday",
      description:
        "Cook 3–4 things on Sunday for the week. Saves time, money, and the daily 'what's for dinner' decision.",
      category: "routine",
      dayOffset: 35,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
    {
      title: "Find a local farmer's market",
      description:
        "Most cities have a Saturday morning market. Cheaper produce, better quality, and you'll see the same vendors weekly.",
      category: "exploration",
      dayOffset: 42,
      isEventAttendance: true,
      isRecurringActivity: false,
    },
    {
      title: "Cook one new recipe weekly for 4 weeks",
      description:
        "Pick one cookbook or one cuisine and explore. By month-end you have 4 new dishes in rotation.",
      category: "hobby",
      dayOffset: 50,
      isEventAttendance: false,
      isRecurringActivity: true,
    },
  ],

  "Visit a local climbing gym for a day pass": [
    {
      title: "Try outdoor climbing",
      description:
        "Find a local crag or join a guided outdoor trip. Indoor and outdoor are different sports — and outdoor is where the community really gels.",
      category: "exploration",
      dayOffset: 40,
      isEventAttendance: true,
      isRecurringActivity: false,
    },
    {
      title: "Sign up for a gym membership",
      description:
        "If you've been 3+ times, the monthly membership ($80–110) pays for itself fast. Commitment device.",
      category: "hobby",
      dayOffset: 45,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
    {
      title: "Take a beginner technique class",
      description:
        "Most gyms run weekly beginner clinics ($25–50) covering body position, falling, route reading. Faster than learning alone.",
      category: "hobby",
      dayOffset: 50,
      isEventAttendance: true,
      isRecurringActivity: false,
    },
  ],

  "Search Meetup for events matching your interests and RSVP to one": [
    {
      title: "RSVP to the next event from the same group",
      description:
        "Same group, second time. Faces will start to feel familiar — the second visit is where everything changes.",
      category: "community",
      dayOffset: 35,
      isEventAttendance: true,
      isRecurringActivity: false,
    },
    {
      title: "Stay for the post-event hangout",
      description:
        "Most Meetups have an informal continuation (bar, dinner). That's where the real conversations happen.",
      category: "community",
      dayOffset: 45,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
  ],

  "Join a running club": [
    {
      title: "Sign up for a 5K with the group",
      description:
        "Pick a local race. Train with the club. Race day becomes a shared event.",
      category: "hobby",
      dayOffset: 50,
      isEventAttendance: true,
      isRecurringActivity: false,
    },
    {
      title: "Volunteer to lead a weekly route",
      description:
        "Most clubs welcome a new route leader. You'll learn the regulars' names fast and become 'the new lead' instead of 'the new runner'.",
      category: "community",
      dayOffset: 60,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
    {
      title: "Track your weekly mileage for 4 weeks",
      description:
        "Use Strava or a notes app. Patterns emerge, goals follow, and you have something to talk about at the post-run coffee.",
      category: "routine",
      dayOffset: 40,
      isEventAttendance: false,
      isRecurringActivity: true,
    },
  ],

  "Visit a bookstore in a neighborhood you don't live in": [
    {
      title: "Sign up for the store's events newsletter",
      description:
        "Author readings, book launches, signed-copy sales — they happen 2–4 times per month and are mostly free.",
      category: "community",
      dayOffset: 35,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
    {
      title: "Attend an author reading or book launch",
      description:
        "Free, low-stakes, you hear an author talk and meet other readers afterward. Lowest-effort literary social event.",
      category: "community",
      dayOffset: 45,
      isEventAttendance: true,
      isRecurringActivity: false,
    },
    {
      title: "Join a book club meeting once",
      description:
        "Most indie bookstores host one. Even if the pick isn't your usual taste, the discussion is the point.",
      category: "community",
      dayOffset: 55,
      isEventAttendance: true,
      isRecurringActivity: false,
    },
  ],

  "Attend the Meetup event you RSVP'd to": [
    {
      title: "Become a regular at this Meetup",
      description:
        "Attend 3 in a row. People notice. Conversations get easier each time — by the third visit you're not 'new' anymore.",
      category: "community",
      dayOffset: 50,
      isEventAttendance: false,
      isRecurringActivity: true,
    },
    {
      title: "Reach out to two people you met for coffee",
      description:
        "1:1 follow-up is where casual contacts become real connections. Send 'hey, want to grab coffee?' within a week.",
      category: "community",
      dayOffset: 45,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
  ],

  "Set up a recurring weekly anchor": [
    {
      title: "Add a second weekly anchor",
      description:
        "Two consistent things per week makes a routine. Pick another category — different from the first, so you're not over-rotating on one thing.",
      category: "routine",
      dayOffset: 35,
      isEventAttendance: false,
      isRecurringActivity: true,
    },
    {
      title: "Invite someone to join your anchor",
      description:
        "Coffee, run, class — anything you already do regularly. Sharing it makes both you and them more likely to keep showing up.",
      category: "community",
      dayOffset: 50,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
  ],

  "Eat at a restaurant outside your usual cuisine": [
    {
      title: "Eat at a new restaurant in a new neighborhood",
      description:
        "Pair the new cuisine with a part of town you haven't explored. Two for one.",
      category: "exploration",
      dayOffset: 40,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
    {
      title: "Try cooking it yourself once",
      description:
        "Pick one dish from the cuisine you liked. YouTube + a grocery run = a satisfying weekend.",
      category: "hobby",
      dayOffset: 55,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
  ],

  "Invite one acquaintance to do something": [
    {
      title: "Make it a recurring hangout",
      description:
        "If the first invite went well, suggest the same thing next month. Light cadence builds rapport.",
      category: "community",
      dayOffset: 40,
      isEventAttendance: false,
      isRecurringActivity: true,
    },
    {
      title: "Introduce them to someone else",
      description:
        "If you've met two acquaintances in different contexts, get them in the same room. You become the connector — sticky social role.",
      category: "community",
      dayOffset: 55,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
  ],

  "Book a beginner climbing class": [
    {
      title: "Take a follow-up class",
      description:
        "Intermediate or weekly skills clinic. Same instructor if possible — they remember you and adjust the teaching.",
      category: "hobby",
      dayOffset: 45,
      isEventAttendance: true,
      isRecurringActivity: false,
    },
    {
      title: "Climb with someone from the class",
      description:
        "Trade phone numbers at the end of class. Most beginners want partners — be the one who follows up.",
      category: "community",
      dayOffset: 50,
      isEventAttendance: false,
      isRecurringActivity: false,
    },
  ],
};

// Fallback for unknown anchors — e.g. custom tasks added from a future
// For You item, or AI-generated tasks before they have catalog entries.
const GENERIC: DeepeningTemplate[] = [
  {
    title: "Make this weekly",
    description:
      "If you've done it once and liked it, the easiest deepening step is to do it again. Block the same time next week.",
    category: "routine",
    dayOffset: 35,
    isEventAttendance: false,
    isRecurringActivity: true,
  },
  {
    title: "Invite someone to join you",
    description:
      "The thing gets stickier the moment it stops being solo.",
    category: "community",
    dayOffset: 45,
    isEventAttendance: false,
    isRecurringActivity: false,
  },
];

// Look up deepening templates for a given anchor by its title.
// Returns the generic fallback if the title isn't in the catalog.
//
// When AI is wired up, replace this with a server call. The shape of
// the return value should stay identical so call sites don't change.
export function getDeepeningTemplates(anchorTitle: string): DeepeningTemplate[] {
  return CATALOG[anchorTitle] ?? GENERIC;
}
