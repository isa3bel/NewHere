import type { AiWeekOneDetail } from "@/lib/ai/types";

// Hand-written Austin-specific Week 1 overlay for the public sample page.
// Mirrors the exact shape the real Claude call produces — including
// Google Maps deep-links, city-specific provider names, and rich steps —
// so the sample looks identical to a paid generation without spending a
// cent. Keep this current as Austin facts change (or as the prompt evolves).
export const SAMPLE_AUSTIN_WEEK_ONE: AiWeekOneDetail[] = [
  {
    slotKey: "w1-license",
    titleOverride:
      "Update your Texas driver's license + Travis County vehicle registration",
    descriptionOverride:
      "Texas DPS handles licenses; Travis County Tax Office handles vehicle registration.",
    guide: {
      estimatedTime: "1–2 hours online, plus one in-person DPS visit",
      overview:
        "Texas gives you 90 days to convert an out-of-state license, and 30 days to register your vehicle. The DPS visit is the bottleneck — book it first.",
      steps: [
        {
          title: "Book a Texas DPS appointment",
          body: "Walk-ins are rare and brutal. Use the online scheduler to lock a slot at an Austin office.",
          link: {
            url: "https://public.txdpsscheduler.com/",
            label: "Schedule at txdpsscheduler.com",
          },
        },
        {
          title: "Gather your documents",
          body: "Bring your out-of-state license, proof of Texas residence (lease or utility bill), proof of insurance, and your social security card or W-2.",
        },
        {
          title: "Register your vehicle at Travis County",
          body: "Travis County Tax Office handles registration + title transfer. Bring your title, insurance, VIR (vehicle inspection report — get inspected first at any inspection station).",
          link: {
            url: "https://tax-office.traviscountytx.gov/",
            label: "Travis County Tax Office",
          },
        },
        {
          title: "Update voter registration",
          body: "Often a checkbox on the DPS license form. Otherwise vote.org has a one-stop Texas form.",
          link: {
            url: "https://www.vote.org/register-to-vote/texas/",
            label: "Register to vote in Texas",
          },
        },
      ],
      resources: [
        {
          url: "https://www.dps.texas.gov/section/driver-license",
          label: "Texas DPS — Driver License",
          description: "Official Texas DPS driver license info.",
        },
        {
          url: "https://www.txdmv.gov/motorists",
          label: "TxDMV — Motorist Services",
          description: "Title transfer and registration details.",
        },
      ],
    },
  },
  {
    slotKey: "w1-address",
    titleOverride: "Update your address everywhere",
    descriptionOverride:
      "USPS forwarding, banks, employer, credit cards, insurance — start with USPS.",
    guide: {
      estimatedTime: "45 min – 1.5 hours, mostly online",
      overview:
        "USPS forwarding takes ~10 days to kick in, so start that first. Then walk down a checklist of every account that mails you anything.",
      steps: [
        {
          title: "Set up USPS mail forwarding",
          body: "$1.10 identity verification fee. Forwards first-class mail for 12 months.",
          link: {
            url: "https://moversguide.usps.com/",
            label: "USPS Change of Address",
          },
        },
        {
          title: "Update your banks + credit cards",
          body: "Log in to each, find Profile → Address. Often hidden under Settings.",
        },
        {
          title: "Update your employer + W-4",
          body: "HR system or directly with payroll. Tax withholding for Texas differs from many other states (no state income tax).",
        },
        {
          title: "Update your auto + renter's/home insurance",
          body: "Rates can change significantly between states — get a re-quote rather than just updating the address.",
        },
        {
          title: "Update subscriptions",
          body: "Amazon, streaming services, software subscriptions, magazines. Easy to miss until something charges to your old card.",
        },
      ],
    },
  },
  {
    slotKey: "w1-utilities",
    titleOverride:
      "Set up Austin Energy, Texas Gas, City of Austin Water + internet",
    descriptionOverride:
      "Austin Energy = electric; Texas Gas Service = natural gas; City of Austin = water/trash; pick internet from Spectrum, AT&T Fiber, or Google Fiber.",
    guide: {
      estimatedTime: "1–2 hours total, mostly online",
      overview:
        "Austin's utilities are split across multiple providers. Set them up the day you sign the lease — none of them are instant.",
      steps: [
        {
          title: "Sign up for Austin Energy (electric)",
          body: "City-owned utility. Initial connection fee + deposit if no Texas credit history.",
          link: {
            url: "https://austinenergy.com/",
            label: "austinenergy.com",
          },
        },
        {
          title: "Sign up for Texas Gas Service (if you have gas)",
          body: "Most newer Austin apartments are all-electric. Confirm with your landlord before setting this up.",
          link: {
            url: "https://www.texasgasservice.com/",
            label: "texasgasservice.com",
          },
        },
        {
          title: "Sign up for Austin Water + trash/recycling",
          body: "Bundled through the City of Austin. Trash and recycling pickup days are set by your address.",
          link: {
            url: "https://www.austintexas.gov/department/water",
            label: "City of Austin — Water",
          },
        },
        {
          title: "Pick an internet provider",
          body: "Google Fiber and AT&T Fiber are fastest where available (check your address). Spectrum covers virtually all of Austin. Compare plans by zip code.",
          link: {
            url: "https://fiber.google.com/cities/austin/",
            label: "Google Fiber Austin",
          },
        },
        {
          title: "Sign up for AustinReady emergency alerts",
          body: "Free severe weather + power emergency notifications. Useful in a city that sees ice storms and grid stress.",
          link: {
            url: "https://www.warncentraltexas.org/",
            label: "Warn Central Texas",
          },
        },
      ],
    },
  },
  {
    slotKey: "w1-library",
    titleOverride: "Get an Austin Public Library card",
    descriptionOverride:
      "Free at any of 21 branches across the city. Includes ebooks/audiobooks via Libby and free passes to museums.",
    guide: {
      estimatedTime: "20 min in person",
      overview:
        "APL is one of Austin's underrated welcome gifts: free books, free coworking, free museum passes, free events. Five minutes to sign up.",
      steps: [
        {
          title: "Find your nearest branch",
          body: "21 branches across Austin; pick the one closest to you. The Central Library downtown is worth a visit just for the architecture.",
          link: {
            url: "https://www.google.com/maps/search/austin+public+library",
            label: "Find branches on Google Maps",
          },
        },
        {
          title: "Bring ID + proof of address",
          body: "Driver's license + a utility bill or lease showing a Travis/Williamson/Hays county address. Card is free.",
        },
        {
          title: "Download Libby (for ebooks + audiobooks)",
          body: "Sign in with your new APL card number. Hundreds of thousands of titles, no waitlist on many.",
          link: {
            url: "https://libbyapp.com/",
            label: "Libby app",
          },
        },
        {
          title: "Browse upcoming events",
          body: "Author talks, language exchanges, kids' programs, free movie nights. The Central Library has a rooftop garden — go see it.",
          link: {
            url: "https://library.austintexas.gov/events",
            label: "APL events calendar",
          },
        },
      ],
      resources: [
        {
          url: "https://library.austintexas.gov/",
          label: "Austin Public Library",
          description: "Main APL site — branches, hours, events.",
        },
      ],
    },
  },
  {
    slotKey: "w1-health",
    titleOverride: "Find a PCP, dentist, and pharmacy in Austin",
    descriptionOverride:
      "Major networks: Ascension Seton, St. David's HealthCare, Austin Regional Clinic. CVS, Walgreens, and H-E-B Pharmacy are everywhere.",
    guide: {
      estimatedTime: "1–2 hours of research, then booking",
      overview:
        "Austin's health systems split largely between Ascension Seton, St. David's, and Austin Regional Clinic (ARC). Start by checking which is in-network for your insurance, then book a routine intake visit.",
      steps: [
        {
          title: "Check your insurance network",
          body: "Most Austin employers offer plans with at least one of Ascension Seton, St. David's, or ARC in-network. Confirm before picking a clinic.",
        },
        {
          title: "Pick a PCP at an in-network clinic",
          body: "ARC has 25+ locations city-wide and same-week appointments. Ascension Seton and St. David's have larger hospital systems for specialty care.",
          link: {
            url: "https://www.austinregionalclinic.com/",
            label: "Austin Regional Clinic",
          },
        },
        {
          title: "Note your nearest urgent care",
          body: "Easier to research now than at 11pm. ARC, St. David's, and Next Level Urgent Care all run after-hours clinics in Austin.",
          link: {
            url: "https://www.google.com/maps/search/urgent+care+austin",
            label: "Urgent care on Google Maps",
          },
        },
        {
          title: "Pick a pharmacy",
          body: "H-E-B Pharmacy is bundled with your grocery run; CVS and Walgreens are 24-hour at select Austin locations. Transfer prescriptions ahead of time.",
        },
        {
          title: "Find a dentist",
          body: "Insurance plans typically have a separate dental network. Get a cleaning on the calendar in your first 30 days.",
        },
      ],
    },
  },
  {
    slotKey: "w1-transit",
    titleOverride: "Get a CapMetro card + learn Austin parking rules",
    descriptionOverride:
      "CapMetro is Austin's bus + MetroRail system. Downtown parking enforcement is strict — read your signs.",
    guide: {
      estimatedTime: "30 min — download app + skim parking rules",
      overview:
        "CapMetro covers most of Austin via bus and the MetroRail Red Line. Parking near downtown is notoriously well-enforced — read the signs every time.",
      steps: [
        {
          title: "Download the CapMetro app",
          body: "Tap-to-board with mobile fares. $2.50 single ride, $5.50 day pass, $41.25 monthly. No physical card needed.",
          link: {
            url: "https://www.capmetro.org/app",
            label: "CapMetro app",
          },
        },
        {
          title: "Plan your common routes",
          body: "MetroRail Red Line runs north–south to Leander. MetroRapid 801 + 803 cover the Lamar / South Congress corridors with frequent buses.",
          link: {
            url: "https://www.capmetro.org/planner",
            label: "CapMetro trip planner",
          },
        },
        {
          title: "Read Austin parking rules",
          body: "Street parking downtown is metered via the ParkATX app. Residential permit zones (e.g. East Austin, Hyde Park) tow non-permit cars after a warning. Read every sign on the block.",
          link: {
            url: "https://www.austintexas.gov/department/parking",
            label: "City of Austin Parking",
          },
        },
        {
          title: "Set up your TxTag (toll pass)",
          body: "MoPac and 130 are toll roads; even occasional users save money with a TxTag. Free to order online.",
          link: {
            url: "https://www.txtag.org/",
            label: "TxTag",
          },
        },
      ],
      resources: [
        {
          url: "https://www.capmetro.org/",
          label: "CapMetro",
          description: "Schedules, fares, route maps.",
        },
        {
          url: "https://www.google.com/maps/search/capmetro+park+and+ride+austin",
          label: "Park-and-ride locations",
          description: "CapMetro park-and-ride lots on Google Maps.",
        },
      ],
    },
  },
  {
    slotKey: "w1-daily-shops",
    titleOverride: "Locate your H-E-B + Whole Foods + neighborhood essentials",
    descriptionOverride:
      "H-E-B is the local favorite (and the cultural institution); Whole Foods HQ is downtown; Central Market is the upscale H-E-B sibling.",
    guide: {
      estimatedTime: "1 hour of mapping + first runs",
      overview:
        "Austinites are famously loyal to H-E-B. It's typically the cheapest, has the best Texas-specific selection, and runs unusually good prepared food and tortilleria sections. Find yours.",
      steps: [
        {
          title: "Find your nearest H-E-B",
          body: "Skip Whole Foods for everyday groceries. H-E-B has 30+ stores across the metro. Set up the app for clicked-list and curbside pickup.",
          link: {
            url: "https://www.google.com/maps/search/H-E-B+austin",
            label: "H-E-B on Google Maps",
          },
        },
        {
          title: "Bookmark the Whole Foods flagship",
          body: "The downtown Whole Foods is the original — worth a visit, even if you don't shop there weekly. They host live music, food demos, and beer tastings.",
          link: {
            url: "https://www.wholefoodsmarket.com/stores/austin",
            label: "Whole Foods flagship",
          },
        },
        {
          title: "Find your local hardware store",
          body: "Home Depot + Lowes are everywhere. For neighborhood / boutique hardware, Breed & Co. (Tarrytown) is the long-standing Austin choice.",
          link: {
            url: "https://www.google.com/maps/search/hardware+store+austin",
            label: "Hardware stores on Google Maps",
          },
        },
        {
          title: "Pick a coffee shop you can become a regular at",
          body: "Austin's coffee scene is dense. Walk 10 blocks in any direction in central Austin and you'll hit 2–3 independents — Cuvee, Houndstooth, Patika, Greater Goods, Flat Track. Pick one near you and go twice this week.",
          link: {
            url: "https://www.google.com/maps/search/independent+coffee+austin",
            label: "Independent coffee on Google Maps",
          },
        },
        {
          title: "Flag a gym, dry cleaner, and barber/salon",
          body: "These are the places you'll end up at again and again. Easier to lock in now than to figure out at 9am on a Saturday.",
        },
      ],
    },
  },
  {
    slotKey: "w1-home-safety",
    titleOverride: "Home safety + maintenance basics",
    descriptionOverride:
      "Detectors, water shutoff, electrical panel, spare keys. Not Austin-specific — but worth doing in your first week anywhere.",
    guide: {
      estimatedTime: "30–60 minutes",
      overview:
        "The stuff you'll be glad you sorted before you actually need it. Set a 30-min timer and walk through your place with this list.",
      steps: [
        {
          title: "Test smoke + CO detectors",
          body: "Press the test button on each. Replace batteries if it chirps. Detectors expire — check the date on the back; replace if older than 10 years.",
        },
        {
          title: "Locate the main water shutoff",
          body: "Usually near the water heater, in the garage, or in a basement. For apartments, ask building management. Photograph it for future you.",
        },
        {
          title: "Locate + label the electrical panel",
          body: "Open the panel, find the main breaker, identify which switch controls what. Previous tenants may have started labels.",
        },
        {
          title: "Make spare keys",
          body: "One extra for yourself (in your bag), one for a trusted neighbor or friend. Hardware stores cut keys in 5 minutes.",
        },
        {
          title: "Confirm trash + recycling pickup days",
          body: "City of Austin sets pickup days by your address — search 'Austin trash schedule' + your address.",
          link: {
            url: "https://www.austintexas.gov/department/austin-resource-recovery",
            label: "Austin Resource Recovery",
          },
        },
      ],
    },
  },
];
