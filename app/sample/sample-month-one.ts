import type { Month1Suggestion } from "@/app/(app)/plan/PlanView";

// Hand-crafted "as if" AI output for the /sample page so the Month 1
// surface mirrors what a real user sees once Claude has run. Three
// goals × three tiles, each shaped exactly like AiMonth1Tile.
//
// Public landing page — do not link to anything sensitive here. URLs
// point at well-known Austin orgs or fall back to category-level
// destinations so a click never feels broken.

export const SAMPLE_AUSTIN_GOALS = [
  "Make new friends",
  "Build healthy habits",
  "Explore the city",
];

export const SAMPLE_AUSTIN_MONTH_ONE: Month1Suggestion[] = [
  // ─────────────────────────────── Make new friends
  {
    tile: {
      id: "sample-austin-newcomers-club",
      cluster: "Make new friends",
      title: "Austin Newcomers Club",
      type: "community",
      icon: "👋",
      shortDescription:
        "1,000+ member club built specifically for people new to Austin",
      longDescription:
        "Long-running newcomer-focused community with weekly social mixers, monthly themed events (hiking, brunch, happy hours), and special-interest sub-groups. Low-pressure way to meet people in the same 'just got here' boat without having to be the new face at someone else's club.",
      links: [
        {
          label: "Join + event calendar",
          url: "https://austinnewcomers.com",
        },
      ],
      meta: {
        cost: "$30/year membership",
        schedule: "Multiple events weekly",
        location: "Various neighborhoods",
        howToJoin:
          "Pay annual dues online → access the full calendar → RSVP to anything that sounds fun.",
      },
      matchedInterest: "community",
    },
    addedToPlan: false,
    completed: false,
  },
  {
    tile: {
      id: "sample-austin-beer-run-club",
      cluster: "Make new friends",
      title: "Austin Beer Run Club",
      type: "community",
      icon: "🍺",
      shortDescription:
        "Easy 3-mile group run, beers at a local brewery after",
      longDescription:
        "Self-organized Thursday run that ends at a rotating East Austin brewery. Pace groups for everyone from 'I jog sometimes' to fast. Beer (or seltzer) on tap once you're done. Friendly, self-selecting crowd — about 60% locals, 40% new arrivals.",
      links: [
        {
          label: "Strava club",
          url: "https://www.strava.com/clubs",
        },
      ],
      meta: {
        cost: "Free run · beer at brewery prices",
        schedule: "Thursdays 6:30pm",
        location: "East Austin, rotating breweries",
        howToJoin:
          "Show up to any Thursday run. No signup needed. Check Strava the morning-of for the meet location.",
      },
      matchedInterest: "running",
    },
    addedToPlan: false,
    completed: false,
  },
  {
    tile: {
      id: "sample-r-austin-meetups",
      cluster: "Make new friends",
      title: "r/Austin community meetups",
      type: "community",
      icon: "💬",
      shortDescription:
        "Subreddit hosts roughly monthly real-life meetups in different neighborhoods",
      longDescription:
        "The largest local subreddit has a tradition of in-person meetups — typically a casual happy hour at a bar, 30–100 people. The crowd skews diverse: techies, teachers, grad students, contractors. Look for posts flaired [Meetup].",
      links: [
        {
          label: "r/Austin",
          url: "https://reddit.com/r/austin",
        },
      ],
      meta: {
        cost: "Free entry, pay for own drinks",
        schedule: "Roughly monthly, announced 2 weeks ahead",
        location: "Different bar each time",
        howToJoin:
          "Check the subreddit weekly. RSVP by commenting on the announcement thread.",
      },
      matchedInterest: "community",
    },
    addedToPlan: false,
    completed: false,
  },

  // ─────────────────────────────── Build healthy habits
  {
    tile: {
      id: "sample-crux-climbing-gym",
      cluster: "Build healthy habits",
      title: "Crux Climbing Center",
      type: "organization",
      icon: "🧗",
      shortDescription: "Bouldering + ropes across two Austin locations",
      longDescription:
        "Crux runs the most active climbing gyms in town — South (Manchaca) and North (Burnet). Bouldering walls reset every couple of weeks; rope and lead routes too. Strong social scene around the boards; beginner classes weekly if you've never tied in before.",
      links: [
        {
          label: "Day passes + membership",
          url: "https://www.cruxclimbingcenter.com",
        },
      ],
      meta: {
        cost: "Day pass $24 · membership $89/mo",
        schedule: "Daily 6am – 11pm",
        location: "South Austin + North Austin",
        howToJoin:
          "Walk in for a day pass. Watch the 5-minute orientation video. Shoes and chalk available to rent.",
      },
      matchedInterest: "climbing",
    },
    addedToPlan: false,
    completed: false,
  },
  {
    tile: {
      id: "sample-black-swan-yoga",
      cluster: "Build healthy habits",
      title: "Black Swan Yoga",
      type: "organization",
      icon: "🧘",
      shortDescription: "Donation-based community yoga, four Austin studios",
      longDescription:
        "Sliding-scale ($10–25 suggested) vinyasa, slow flow, and restorative classes at four locations. Strong neighborhood-studio feel — same teachers and regulars build the vibe. Mats and props provided; first-timers get walked through the basics.",
      links: [
        {
          label: "Schedule",
          url: "https://blackswanyoga.com",
        },
      ],
      meta: {
        cost: "$10–25 donation per class",
        schedule: "Multiple daily, 6am–8pm",
        location: "South Lamar, East Austin, North Loop, Tarrytown",
        howToJoin:
          "Show up 10 minutes early to your first class. Tell the teacher you're new — they'll position you near the front.",
      },
      matchedInterest: "yoga",
    },
    addedToPlan: false,
    completed: false,
  },
  {
    tile: {
      id: "sample-lady-bird-lake-loop",
      cluster: "Build healthy habits",
      title: "Lady Bird Lake Trail",
      type: "resource",
      icon: "🌳",
      shortDescription:
        "Free 10-mile shaded loop along the river — Austin's outdoor living room",
      longDescription:
        "The loop everyone knows. Flat, shaded, runners + walkers + dogs all morning. Free, no-signup-required anchor for outdoor mornings. Most locals build their week around the loop — run clubs, paddleboard rentals, and parks branch off all along it.",
      links: [
        {
          label: "Trail map",
          url: "https://thetrailfoundation.org",
        },
      ],
      meta: {
        cost: "Free",
        schedule: "Open 5am – midnight, busiest 7–9am + 5–7pm",
        location: "Downtown / Zilker area",
        howToJoin:
          "Park at Auditorium Shores or Mopac. Pick a direction. You'll see everyone else doing the same thing.",
      },
      matchedInterest: "running",
    },
    addedToPlan: false,
    completed: false,
  },

  // ─────────────────────────────── Explore the city
  {
    tile: {
      id: "sample-austin-central-library",
      cluster: "Explore the city",
      title: "Austin Central Library",
      type: "organization",
      icon: "📚",
      shortDescription:
        "Architectural showpiece downtown — and a calendar of free programs",
      longDescription:
        "The new Central Library is worth visiting just for the building (six floors of natural light, a rooftop garden, a café). It also runs free programs: author talks, music in the courtyard, weekly tech help, kids' weekend events. Grab a library card on your first visit — it's instant and unlocks tons of city services beyond books.",
      links: [
        {
          label: "Programs calendar",
          url: "https://library.austintexas.gov",
        },
      ],
      meta: {
        cost: "Free",
        schedule: "Tues–Sun, programs vary",
        location: "Downtown — 710 W Cesar Chavez",
        howToJoin:
          "Bring proof of Austin address. Card takes about 5 minutes.",
      },
      matchedInterest: "books",
    },
    addedToPlan: false,
    completed: false,
  },
  {
    tile: {
      id: "sample-east-austin-studio-tour",
      cluster: "Explore the city",
      title: "East Austin Studio Tour (EAST)",
      type: "community",
      icon: "🎨",
      shortDescription:
        "Self-guided open-studio tour through East Austin artists, weekends in Nov",
      longDescription:
        "EAST is an annual two-weekend tour where dozens of East Austin studios open their doors. Free, walkable, casual — lots of food trucks and small galleries between studios. Even outside the official tour, many of these studios host monthly open hours throughout the year.",
      links: [
        {
          label: "Studio map",
          url: "https://east.bigmedium.org",
        },
      ],
      meta: {
        cost: "Free",
        schedule: "Two weekends in November + monthly open hours at most studios",
        location: "East Austin",
        howToJoin:
          "Download the map, pick three studios, walk the route. Talk to the artists — that's the whole point.",
      },
      matchedInterest: "art",
    },
    addedToPlan: false,
    completed: false,
  },
  {
    tile: {
      id: "sample-texas-hill-country-wineries",
      cluster: "Explore the city",
      title: "Texas Hill Country Wine Trail",
      type: "resource",
      icon: "🍇",
      shortDescription:
        "30+ wineries in driving distance, mostly along US-290 west",
      longDescription:
        "An hour west of Austin, the Hill Country has become a real wine region. Most wineries open weekends for $15–25 tastings, with live music and food trucks at the larger ones. Bus tours run from Austin if you don't want to drive. Pick 2–3 — more than that and they blur together.",
      links: [
        {
          label: "Texas Wine Trail",
          url: "https://texaswinetrail.com",
        },
      ],
      meta: {
        cost: "$15–25 per tasting",
        schedule: "Most open Fri–Sun",
        location: "Fredericksburg, Driftwood, Johnson City",
        howToJoin:
          "Pick a Saturday. Reserve at 2–3 wineries via their websites. Eat lunch in Fredericksburg between stops.",
      },
      matchedInterest: "wine",
    },
    addedToPlan: false,
    completed: false,
  },
];
