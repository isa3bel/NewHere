import Anthropic from "@anthropic-ai/sdk";

import type { Profile } from "@/lib/types";

import { readCachedSuggestions, writeCachedSuggestions } from "./cache";
import { ANTHROPIC_MODEL, USE_FAKE_AI } from "./config";
import { profileFingerprint } from "./fingerprint";
import { stripCitations, stripCitationsOptional } from "./sanitize";
import type {
  AiSuggestion,
  AiWeekOneDetail,
  GenerationResult,
} from "./types";
import { isUnderDailyLimit, logAiGeneration } from "./usage-log";

// ============================================================
// Public entry point
// ============================================================

// Returns city-specific overlays for the 8 Week 1 essentials,
// keyed by slot key. Empty array on failure (logged in ai_generations).
// Cache key: (user_id, "week_one", profile_hash).
export async function getOrGenerateWeekOneOverlay(
  userId: string,
  profile: Profile,
): Promise<AiWeekOneDetail[]> {
  const surface = "week_one" as const;
  const fingerprint = profileFingerprint(profile, surface);

  const cached = await readCachedSuggestions(userId, surface, fingerprint);
  if (cached) {
    await logAiGeneration({
      userId,
      surface,
      model: cached.model,
      cacheHit: true,
      inputTokens: 0,
      outputTokens: 0,
      searchCount: 0,
      succeeded: true,
    });
    // We stored an AiSuggestion[]-typed content column, but for week_one
    // the JSON is AiWeekOneDetail[]. The cache table is intentionally
    // type-loose (jsonb).
    return cached.content as unknown as AiWeekOneDetail[];
  }

  if (!(await isUnderDailyLimit(userId))) {
    await logAiGeneration({
      userId,
      surface,
      model: USE_FAKE_AI ? "mock" : ANTHROPIC_MODEL,
      cacheHit: false,
      inputTokens: 0,
      outputTokens: 0,
      searchCount: 0,
      succeeded: false,
      errorMessage: "per_user_daily_limit_exceeded",
    });
    return [];
  }

  try {
    const result = await generateWeekOneOverlay(profile);
    await writeCachedSuggestions({
      userId,
      surface,
      profileHash: fingerprint,
      // Cast: cache stores jsonb. We unify at runtime per surface.
      suggestions: result.overlay as unknown as AiSuggestion[],
      model: result.meta.model,
      inputTokens: result.meta.inputTokens,
      outputTokens: result.meta.outputTokens,
      searchCount: result.meta.searchCount,
    });
    await logAiGeneration({
      userId,
      surface,
      model: result.meta.model,
      cacheHit: false,
      inputTokens: result.meta.inputTokens,
      outputTokens: result.meta.outputTokens,
      searchCount: result.meta.searchCount,
      succeeded: true,
    });
    return result.overlay;
  } catch (err) {
    await logAiGeneration({
      userId,
      surface,
      model: USE_FAKE_AI ? "mock" : ANTHROPIC_MODEL,
      cacheHit: false,
      inputTokens: 0,
      outputTokens: 0,
      searchCount: 0,
      succeeded: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

// ============================================================
// Generator (mock or real)
// ============================================================

type WeekOneGenerationResult = {
  overlay: AiWeekOneDetail[];
  meta: GenerationResult["meta"];
};

async function generateWeekOneOverlay(
  profile: Profile,
): Promise<WeekOneGenerationResult> {
  if (USE_FAKE_AI) return buildMockOverlay(profile);
  return callClaudeForWeekOne(profile);
}

// ============================================================
// Mock — clearly marks each slot's title with the user's city so
// the overlay path is visually verifiable end-to-end without paying.
// ============================================================

const WEEK_ONE_SLOTS = [
  "w1-license",
  "w1-address",
  "w1-utilities",
  "w1-library",
  "w1-health",
  "w1-transit",
  "w1-daily-shops",
  "w1-home-safety",
] as const;

const STATIC_TITLES: Record<(typeof WEEK_ONE_SLOTS)[number], string> = {
  "w1-license": "Update your driver's license",
  "w1-address": "Update your address everywhere",
  "w1-utilities": "Set up utilities and internet",
  "w1-library": "Get a library card",
  "w1-health": "Find a doctor, dentist, and pharmacy",
  "w1-transit": "Learn your transit options",
  "w1-daily-shops": "Locate your daily essentials",
  "w1-home-safety": "Home safety + maintenance basics",
};

function buildMockOverlay(profile: Profile): WeekOneGenerationResult {
  const locale = profile.neighborhood
    ? `${profile.neighborhood}, ${profile.city}`
    : profile.city;
  const overlay: AiWeekOneDetail[] = WEEK_ONE_SLOTS.map((slot) => ({
    slotKey: slot,
    titleOverride: `${STATIC_TITLES[slot]} (${locale})`,
    guide: {
      estimatedTime: "Varies",
      overview: `[Mock overlay for ${locale}] City-specific detail will appear here once USE_FAKE_AI=false.`,
      steps: [
        {
          title: "Mock step",
          body: `When real AI is enabled this is replaced with ${locale}-specific instructions.`,
        },
      ],
    },
  }));

  return {
    overlay,
    meta: {
      model: "mock",
      inputTokens: 0,
      outputTokens: 0,
      searchCount: 0,
      cacheHit: false,
    },
  };
}

// ============================================================
// Real Claude call (with web search)
// ============================================================

const SYSTEM_PROMPT = `You are a research assistant for NewHere. Your job: generate city-specific, actionable how-to guides for the 8 "Week 1" essentials a newcomer must handle in their first week in a new city.

The 8 slots are FIXED. You MUST return exactly these slotKey values, one entry each:
- "w1-license"      → driver's license, vehicle registration, voter registration (state-specific)
- "w1-address"      → USPS forwarding, bank/employer/credit-card address updates
- "w1-utilities"    → electric, gas, water, internet, trash (which providers serve this city)
- "w1-library"      → local public library card (which library system, how to register)
- "w1-health"       → finding a PCP, dentist, pharmacy, urgent care nearby
- "w1-transit"      → city transit system + card + parking rules
- "w1-daily-shops"  → grocery chains, hardware, pharmacy in this city
- "w1-home-safety"  → smoke/CO detectors, water shutoff, electrical panel (generic)

You have web search but you MUST stay under 4 total searches. Budget them on the highest-leverage city-dependent slots first — transit (the card name), utilities (provider names), library (system name), license/registration (state DMV). Do not search for "w1-address" or "w1-home-safety" (generic). Use general knowledge for "w1-health" and "w1-daily-shops" unless a single targeted search gives a clearly better answer.

When a neighborhood is provided in the user message, BIAS the "w1-daily-shops" slot toward that specific neighborhood — name the closest grocery, hardware store, and coffee shop within or adjacent to that neighborhood. For these neighborhood-specific picks, include a Google Maps deep-link in resources or step links so the user can find the spot on a map. Format: \`https://www.google.com/maps/search/<url-encoded-query>\` — e.g. \`https://www.google.com/maps/search/Trader+Joe%27s+Mission+District+San+Francisco\`. You can also use this format for transit stops, library branches, etc. when neighborhood is known.

If no neighborhood is provided, keep "w1-daily-shops" city-level (which chains exist in the city; a generic maps link is still useful, e.g. \`https://www.google.com/maps/search/grocery+store+<city>\`).

CRITICAL — titleOverride writing style:
Titles must NAME the specific local thing whenever one exists. Imperative, ≤60 chars, tells the user exactly what to get/do.

Good (names the local thing):
  San Francisco → "Get a Clipper card"
  Austin        → "Get a CapMetro card"
  NYC           → "Get a MetroCard or OMNY tap"
  San Francisco → "Get an SFPL library card"
  Bay Area      → "Set up PG&E (electric + gas)"
  Austin        → "Set up Austin Energy + city water"
  any TX city   → "Update your Texas driver's license + voter registration"

Bad (generic, just describes the category — do not do this):
  "Learn your transit options"
  "Get a library card"
  "Set up utilities"
  "Update your driver's license"

If a slot has no clear single local "thing" (e.g. home-safety is universal), a generic title is fine — don't invent a fake brand.

Output: a JSON array inside a single \`\`\`json code fence. No prose outside. Each item:

{
  "slotKey": "w1-transit",
  "titleOverride": "Get a Clipper card",
  "descriptionOverride": "Bay Area's contactless transit card — works on Muni, BART, ferries, and Caltrain.",
  "guide": {
    "estimatedTime": "15 min online, or pick up at a Walgreens",
    "overview": "Clipper is the one card that works on every Bay Area transit system. Most newcomers get one in their first week.",
    "steps": [
      { "title": "Order online or in the app", "body": "Free card, $5 minimum load. Ships in 5-7 days.", "link": { "url": "https://www.clippercard.com/", "label": "clippercard.com" } }
    ],
    "resources": [
      { "url": "https://www.sfmta.com/", "label": "SFMTA", "description": "Muni schedules + alerts" }
    ]
  }
}

Prefer official .gov / .org / city/utility websites in links. 3-5 steps per slot. 0-3 resources per slot.`;

function buildUserPrompt(profile: Profile): string {
  const neighborhoodLine = profile.neighborhood
    ? `Neighborhood: ${profile.neighborhood}`
    : `Neighborhood: (not provided — give city-level suggestions for daily-shops)`;

  return `Generate Week 1 city-specific overlays for this user:

City: ${profile.city}
${neighborhoodLine}
Has car: ${profile.hasCar ? "yes" : "no"}
Budget tier: ${profile.budgetTier}

Use web search to ground license/registration, utilities, library, transit, and daily-shops in ${profile.city}-specific facts (actual provider/system names + URLs). Return JSON only inside one \`\`\`json fence, exactly 8 items, slotKey values matching the list in the system prompt.`;
}

async function callClaudeForWeekOne(
  profile: Profile,
): Promise<WeekOneGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY not set. Add it to .env.local or flip USE_FAKE_AI=true.",
    );
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 6000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(profile) }],
    // Week 1 covers ~5 city-dependent slots → 6 searches gives the model
    // budget to do ~1/slot with a little headroom. Worth a few extra
    // cents over pre_move's 4 because the city specificity matters more here.
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 4,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const searchCount = response.content.filter(
    (b) =>
      b.type === "server_tool_use" &&
      (b as { name?: string }).name === "web_search",
  ).length;

  const overlay = parseAndValidateOverlay(text);

  return {
    overlay,
    meta: {
      model: ANTHROPIC_MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      searchCount,
      cacheHit: false,
    },
  };
}

// ============================================================
// JSON extraction + validation
// ============================================================

const VALID_SLOT_KEYS = new Set<string>(WEEK_ONE_SLOTS);

function parseAndValidateOverlay(text: string): AiWeekOneDetail[] {
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1] : text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr.trim());
  } catch (e) {
    throw new Error(
      `Model returned invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Model output was not a JSON array.");
  }

  const out: AiWeekOneDetail[] = [];
  for (const raw of parsed) {
    const d = validateDetail(raw);
    if (d) out.push(d);
  }
  if (out.length === 0) {
    throw new Error("Model returned 0 valid Week 1 overlay items.");
  }
  return out;
}

function validateDetail(raw: unknown): AiWeekOneDetail | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const slotKey = typeof r.slotKey === "string" ? r.slotKey : null;
  if (!slotKey || !VALID_SLOT_KEYS.has(slotKey)) return null;

  const titleOverride =
    typeof r.titleOverride === "string" ? r.titleOverride : undefined;
  const descriptionOverride =
    typeof r.descriptionOverride === "string"
      ? r.descriptionOverride
      : undefined;

  const g = r.guide;
  if (typeof g !== "object" || g === null) return null;
  const gr = g as Record<string, unknown>;

  const stepsRaw = Array.isArray(gr.steps) ? gr.steps : [];
  const steps = stepsRaw
    .map(validateStep)
    .filter((s): s is NonNullable<ReturnType<typeof validateStep>> => s !== null);
  if (steps.length === 0) return null;

  const resourcesRaw = Array.isArray(gr.resources) ? gr.resources : [];
  const resources = resourcesRaw
    .map(validateResource)
    .filter((r): r is NonNullable<ReturnType<typeof validateResource>> => r !== null);

  return {
    slotKey,
    titleOverride: stripCitationsOptional(titleOverride),
    descriptionOverride: stripCitationsOptional(descriptionOverride),
    guide: {
      estimatedTime: stripCitationsOptional(
        typeof gr.estimatedTime === "string" ? gr.estimatedTime : undefined,
      ),
      overview: stripCitationsOptional(
        typeof gr.overview === "string" ? gr.overview : undefined,
      ),
      steps,
      resources: resources.length > 0 ? resources : undefined,
    },
  };
}

function validateStep(
  raw: unknown,
): { title: string; body?: string; link?: { url: string; label: string } } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== "string") return null;
  const out: {
    title: string;
    body?: string;
    link?: { url: string; label: string };
  } = { title: stripCitations(r.title) };
  if (typeof r.body === "string") out.body = stripCitations(r.body);
  if (typeof r.link === "object" && r.link !== null) {
    const lr = r.link as Record<string, unknown>;
    if (typeof lr.url === "string" && typeof lr.label === "string") {
      out.link = { url: lr.url, label: stripCitations(lr.label) };
    }
  }
  return out;
}

function validateResource(
  raw: unknown,
): { url: string; label: string; description?: string } | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.url !== "string" || typeof r.label !== "string") return null;
  const out: { url: string; label: string; description?: string } = {
    url: r.url,
    label: stripCitations(r.label),
  };
  if (typeof r.description === "string") {
    out.description = stripCitations(r.description);
  }
  return out;
}
