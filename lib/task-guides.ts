import type { Task } from "./types";

// ============================================================
// Public types — what the detail panel renders
// ============================================================

export type TaskStep = {
  title: string;
  body?: string;
  link?: { url: string; label: string };
};

export type TaskResource = {
  url: string;
  label: string;
  description?: string;
};

export type TaskGuide = {
  estimatedTime?: string;
  overview?: string;
  steps: TaskStep[];
  resources?: TaskResource[];
};

// ============================================================
// Hand-written guides for the 8 Week 1 essentials.
// Everything below is dummy / city-agnostic — eventually replaced by an
// LLM + web search call that returns this exact shape, personalized to the
// user's city.
// ============================================================

const GUIDES: Record<string, TaskGuide> = {
  "w1-license": {
    estimatedTime: "1–2 hours, mostly online",
    overview:
      "Most states let you start everything online; an in-person DMV visit is usually only required if your photo needs updating or you've crossed a state line.",
    steps: [
      {
        title: "Find your state's DMV website",
        body: "Bookmark the official .gov page — third-party sites charge unnecessary fees.",
        link: {
          url: "https://www.usa.gov/state-motor-vehicle-services",
          label: "Find your state DMV",
        },
      },
      {
        title: "Gather proof of new address",
        body: "Most states want one or two of: utility bill, lease, bank statement, or recent pay stub showing your new address.",
      },
      {
        title: "Update your driver's license",
        body: "Many states allow address changes online with no DMV visit. Some require an in-person visit if you moved across state lines.",
      },
      {
        title: "Update vehicle registration",
        body: "Sometimes bundled with the license update; sometimes separate. Most states give you ~30 days after moving before you're out of compliance.",
      },
      {
        title: "Register to vote at your new address",
        body: "Often a checkbox during the same DMV flow. Otherwise vote.org has a one-stop form for every state.",
        link: { url: "https://www.vote.org/register-to-vote/", label: "Register to vote" },
      },
    ],
    resources: [
      {
        url: "https://www.vote.org/register-to-vote/",
        label: "vote.org",
        description: "One-stop voter registration across all states.",
      },
      {
        url: "https://moversguide.usps.com/",
        label: "USPS Change of Address",
        description: "Set up mail forwarding before your DMV visit.",
      },
    ],
  },

  "w1-address": {
    estimatedTime: "45 min – 1.5 hours",
    overview:
      "Cascade through every account that mails you anything. USPS forwarding is your safety net — set that up first.",
    steps: [
      {
        title: "Set up USPS mail forwarding",
        body: "Takes ~10 days to activate and forwards mail for 12 months. Small one-time fee for identity verification.",
        link: { url: "https://moversguide.usps.com/", label: "USPS Movers Guide" },
      },
      {
        title: "Update your bank and credit card mailing addresses",
        body: "Every bank, every card. Almost always faster in their mobile apps than calling.",
      },
      {
        title: "Tell your employer (HR + payroll)",
        body: "These are often separate systems even at the same company. Both need updating before W-2 / tax season.",
      },
      {
        title: "Update healthcare and insurance accounts",
        body: "Health insurance, auto insurance, renter's/home insurance, and your pharmacy of record for prescription mailings.",
      },
      {
        title: "Subscriptions and online retailers",
        body: "Amazon and anywhere you order from. Quickly check your default shipping address.",
      },
    ],
  },

  "w1-utilities": {
    estimatedTime: "2–3 hours spread across 2–3 days",
    overview:
      "Some can be done online; others require a quick call. Stagger them — most utilities want a service-start date you can set a few days out.",
    steps: [
      {
        title: "Identify your providers",
        body: "Search '[your city] electric provider' and '[your city] gas provider'. In some areas you have a choice; in others a single utility serves the address.",
      },
      {
        title: "Sign up for electricity",
        body: "Online signup, pick a plan, set the service-start date. Bring your move-in date.",
      },
      {
        title: "Set up gas (if applicable)",
        body: "Sometimes the same provider as electric; often separate. Some apartments include gas in rent.",
      },
      {
        title: "Sign up for water and sewer",
        body: "Usually through the city's utility department, not a private company. Search '[your city] water utility'.",
      },
      {
        title: "Choose an internet provider",
        body: "Compare via BroadbandNow. ISPs often have move-in promotions worth $50–200 in the first year.",
        link: { url: "https://broadbandnow.com/", label: "BroadbandNow" },
      },
      {
        title: "Confirm trash and recycling",
        body: "Some cities include this with property tax or rent; some require separate signup. Check your city's website for pickup days.",
      },
      {
        title: "Get renter's or home insurance",
        body: "Lemonade, Allstate, State Farm, or Geico all have quick quote tools. Renter's is often under $15/month and most landlords require it.",
      },
    ],
  },

  "w1-library": {
    estimatedTime: "30–45 minutes",
    overview:
      "The most underrated welcome gift any city offers. Free books, audiobooks, ebooks, meeting rooms, and often free passes to local museums and parks.",
    steps: [
      {
        title: "Find your local library system",
        body: "Most cities have a central library plus several branch libraries. Pick the closest branch to your home.",
        link: {
          url: "https://www.google.com/search?q=public+library+near+me",
          label: "Find a library nearby",
        },
      },
      {
        title: "Check what ID you need",
        body: "Usually photo ID plus proof of address. Some systems let you start the signup online and finish in person.",
      },
      {
        title: "Visit the branch in person",
        body: "Just walk in during open hours. The signup process is usually 10–15 minutes.",
      },
      {
        title: "Install Libby for ebooks and audiobooks",
        body: "Libby (by OverDrive) is the most common app. Free, no waiting list for non-popular titles, and works on phone, tablet, or Kindle.",
        link: { url: "https://libbyapp.com/", label: "Libby" },
      },
      {
        title: "Ask about extras while you're there",
        body: "Many libraries lend museum passes, state park passes, Wi-Fi hotspots, and tools. Worth asking what's available.",
      },
    ],
  },

  "w1-health": {
    estimatedTime: "1–2 hours of research, plus appointments to book",
    overview:
      "Set up your medical 'home base' before you need it. Easier to research today than at 11pm when you actually need urgent care.",
    steps: [
      {
        title: "Get your insurance card and the provider directory",
        body: "Log into your insurance portal. Use their provider search and filter by 'in-network' — out-of-network is dramatically more expensive.",
      },
      {
        title: "Pick a primary care doctor",
        body: "Look at reviews on Zocdoc or Google. Pick one within 20 minutes of home. Schedule a 'meet-and-greet' or annual physical to establish care.",
        link: { url: "https://www.zocdoc.com/", label: "Zocdoc" },
      },
      {
        title: "Pick a dentist",
        body: "Same approach. Cleanings are every 6 months, so you have time — but pick one before you need it.",
      },
      {
        title: "Pick a pharmacy nearby",
        body: "Transfer existing prescriptions. CVS, Walgreens, and Rite Aid all transfer in <5 minutes via call or app.",
      },
      {
        title: "Note your nearest urgent care and ER",
        body: "Urgent care for non-emergencies (UTI, ear infection, sprains). ER for serious things (chest pain, severe injury). Save both in your phone.",
      },
      {
        title: "Add a vet if you have pets",
        body: "Get records transferred from your old vet. Schedule a new-patient visit to establish care.",
      },
    ],
  },

  "w1-transit": {
    estimatedTime: "30–60 minutes",
    overview:
      "The boring stuff that prevents parking tickets and stress-driving. Sort it now once.",
    steps: [
      {
        title: "Download your city's transit app",
        body: "Often Transit App, Citymapper, or the local agency's own app. Real-time arrivals plus mobile ticketing.",
      },
      {
        title: "Get a transit card or set up mobile pay",
        body: "Many cities now accept Apple Pay or Google Pay directly at the turnstile or bus.",
      },
      {
        title: "Learn your street-sweeping days",
        body: "Street parking gets ticketed during sweeping. Most cities post the schedule by block on their website.",
      },
      {
        title: "Update your toll pass (if you have a car)",
        body: "Each state has its own: E-ZPass, FasTrak, SunPass, TxTag, etc. Mount the tag in the windshield, set up auto-reload.",
      },
      {
        title: "Find your nearest gas or charging station",
        body: "PlugShare for EVs; GasBuddy for traditional vehicles. Save 2–3 reliable spots in your phone.",
      },
    ],
  },

  "w1-daily-shops": {
    estimatedTime: "1–2 hours, often as part of normal errands",
    overview:
      "Build your mental map. These are the places you'll go again and again — knowing them lowers daily friction.",
    steps: [
      {
        title: "Pin your essentials in Google Maps",
        body: "Make a list called 'Local Essentials'. Pin a 'main' grocery (a Trader Joe's / Whole Foods / Wegmans) plus a smaller closer option for quick runs.",
      },
      {
        title: "Find your hardware store and pharmacy",
        body: "Hardware: walking distance ideally. Pharmacy: pick one for the chain you set as your prescription default in w1-health.",
      },
      {
        title: "Visit each at least once",
        body: "Layouts, parking, hours, vibe — things a map can't tell you. Twenty minutes of in-person reconnaissance pays off for months.",
      },
      {
        title: "Find a barber or hair salon",
        body: "Yelp is reasonable for this. Most people need this every 3–6 weeks; pick one before that timer runs out.",
      },
      {
        title: "Find a dry cleaner (if you have dry-clean items)",
        body: "Closer matters more than cheap — you'll only use them if dropping off is easy. Look at hours; 7–7 saves you on weekdays.",
      },
      {
        title: "Try a few coffee shops",
        body: "Aim for one walkable from home and one near places you go regularly. Becoming a regular at a coffee shop is one of the fastest neighborhood wins.",
      },
    ],
  },

  "w1-home-safety": {
    estimatedTime: "30–45 minutes, solo",
    overview:
      "Things you only think about when something goes wrong. Sort them now while you're already in setup mode.",
    steps: [
      {
        title: "Test smoke and CO detectors",
        body: "Press the test button. Replace batteries. If a detector is more than 10 years old, replace the whole unit — they expire.",
      },
      {
        title: "Locate the main water shutoff valve",
        body: "Usually in the basement, garage, or near the water heater. In an apartment, ask your building management. Photograph it for future you.",
      },
      {
        title: "Locate and label the electrical panel",
        body: "Open the panel, find the main breaker, and identify which switch controls what. Previous tenants may have labeled some already.",
      },
      {
        title: "Make two spare keys",
        body: "One extra for yourself (in your bag or hidden), one for a trusted neighbor or friend. Hardware stores cut keys in 5 minutes.",
      },
      {
        title: "Update home security codes",
        body: "Especially if you bought from previous owners or rented from a previous tenant. Alarm codes, garage codes, smart lock codes.",
      },
      {
        title: "Confirm trash and recycling pickup days",
        body: "Most cities have a 'When to put it out' page on their website. Set a recurring phone reminder the night before pickup.",
      },
    ],
  },
};

// Generic placeholder for tasks without a hand-written guide.
// Real implementation will pass this through an LLM + web search.
function genericGuide(task: Task): TaskGuide {
  return {
    estimatedTime: "Varies",
    overview: `A quick way to tackle: ${task.title.toLowerCase()}.`,
    steps: [
      {
        title: "Set a soft deadline this week",
        body: "Even a loose 'by Saturday' commitment makes this dramatically more likely to happen.",
      },
      {
        title: "Take the smallest possible first step",
        body: "Open a tab, send one message, take one walk. Momentum compounds — overthinking doesn't.",
      },
      {
        title: "Come back here and check it off",
        body: "Each completion earns progress toward a badge. The plan is most useful when you actually mark things done.",
      },
    ],
  };
}

export function getTaskGuide(task: Task): TaskGuide {
  return GUIDES[task.id] ?? genericGuide(task);
}
