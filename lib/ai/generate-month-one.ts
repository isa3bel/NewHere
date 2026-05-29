import Anthropic from "@anthropic-ai/sdk";

import type { ForYouItemType } from "@/lib/for-you-data";
import type { Profile, Task } from "@/lib/types";

import {
  readCachedSuggestions,
  writeCachedSuggestions,
} from "./cache";
import { ANTHROPIC_MODEL, USE_FAKE_AI } from "./config";
import { profileFingerprint } from "./fingerprint";
import { stripCitations, stripCitationsOptional } from "./sanitize";
import type {
  AiMonth1Cluster,
  AiMonth1Tile,
  AiSuggestion,
  GenerationResult,
  SurfaceResult,
} from "./types";
import { isUnderDailyLimit, logAiGeneration } from "./usage-log";

const VALID_TYPES = new Set<ForYouItemType>([
  "organization",
  "community",
  "resource",
]);

// ============================================================
// Render-time entry (no inline backfill)
// ============================================================
// Returns the cached Month 1 tiles. Replacement tiles for engaged
// (done / kept) tiles are produced exclusively by the background
// `after()` callback in markForYouCompletedAction — running them
// inline here made every Done / Keep click block the page re-render
// for ~15-30s while a fresh Claude+web_search call ran. The user
// trade-off: if you reload faster than the background backfill
// completes (~15-30s), you may see 2 tiles in that goal instead of
// 3. The next reload picks up the cached replacement.
//
// `tasks` is unused but kept on the signature so callers don't have
// to thread fewer args; this also leaves room to reintroduce
// targeted backfill (e.g. only when no recent task activity) without
// another API change.

export async function ensureMonth1TilesAreBackfilled(
  userId: string,
  profile: Profile,
  _tasks: Task[],
): Promise<SurfaceResult<AiMonth1Tile[]>> {
  void _tasks;
  return getOrGenerateMonth1Tiles(userId, profile);
}

// ============================================================
// Public entry point
// ============================================================

export async function getOrGenerateMonth1Tiles(
  userId: string,
  profile: Profile,
): Promise<SurfaceResult<AiMonth1Tile[]>> {
  if ((profile.interests ?? []).length === 0) {
    return { status: "ok", data: [] };
  }

  const surface = "month_1" as const;
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
    return {
      status: "ok",
      data: cached.content as unknown as AiMonth1Tile[],
    };
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
    return { status: "failed", data: [] };
  }

  try {
    const result = await generateMonth1Tiles(profile);
    await writeCachedSuggestions({
      userId,
      surface,
      profileHash: fingerprint,
      suggestions: result.tiles as unknown as AiSuggestion[],
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
    return { status: "ok", data: result.tiles };
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
    return { status: "failed", data: [] };
  }
}

// ============================================================
// Generator
// ============================================================

type Month1GenerationResult = {
  tiles: AiMonth1Tile[];
  meta: GenerationResult["meta"];
};

async function generateMonth1Tiles(
  profile: Profile,
): Promise<Month1GenerationResult> {
  if (USE_FAKE_AI) return buildMockTiles(profile);
  return callClaudeForMonth1(profile);
}

// ============================================================
// Mock — synthesizes plausible-looking tiles per cluster for the
// user's city so the UI can be exercised end-to-end without API cost.
// ============================================================

function buildMockTiles(profile: Profile): Month1GenerationResult {
  const interest = profile.interests[0] ?? "exploring";
  const city = profile.city;
  // Mock generates 3 tiles per user goal (1-3 goals → 3-9 tiles).
  // Falls back to a single generic cluster if user has no goals stored.
  const goals = profile.goals.length > 0 ? profile.goals : ["Explore the city"];
  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const tiles: AiMonth1Tile[] = goals.flatMap((goal) =>
    Array.from({ length: 3 }, (_, i) => ({
      id: `mock-${slug(goal)}-${i}-${slug(profile.city)}`,
      cluster: goal,
      title: `[Mock] ${goal} option ${i + 1} (${city})`,
      type: i === 0 ? ("community" as const) : ("organization" as const),
      icon: "✨",
      imageUrl: undefined,
      shortDescription: `A mock suggestion mapping to "${goal}" for ${city}.`,
      longDescription: `[Mock overlay for ${city}] Real Claude output replaces this with a specific local org or community that maps to the goal "${goal}". Biased toward the user's interest of ${interest} and adjacent/related fields when applicable.`,
      links: [],
      meta: {
        cost: "—",
        schedule: "Weekly",
        howToJoin: "Mock — real instructions appear with real AI.",
      },
      matchedInterest: interest,
    })),
  );

  return {
    tiles,
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

const SYSTEM_PROMPT = `You are a research assistant for NewHere. Generate "Try things" tiles for a user's Month 1 in a new city — organizations and communities the user can join in their first 30 days that have RECURRING activities.

The user has picked 1–3 GOALS (e.g. "Make new friends", "Build healthy habits", or a custom phrase). For each goal, produce exactly **3 tiles** that map to that goal. So 1 goal → 3 tiles, 2 goals → 6 tiles, 3 goals → 9 tiles. The "cluster" field on each tile MUST be the verbatim text of one of the user's goals.

CRITICAL RULES:
1. **No one-off events.** Every tile must be a standing organization, community, club, or recurring program. A monthly meetup hosted by a real org is fine. A specific "Saturday Oct 12 concert" is NOT — but the venue/group hosting it is, if they have repeat events.
2. **Be city-specific.** Use web search to find real local orgs in the user's city — running clubs, climbing gyms, volunteer chapters, language meetups, indie bookstores, public libraries, parks-and-rec leagues, religious communities, professional groups, art collectives, etc.
3. **Map each tile to a goal.** "cluster" must equal one of the user's listed goals exactly (same casing, same punctuation). Distribute 3 tiles per goal.
4. **Bias by interests AND adjacent fields.** Use the user's stated interests as a starting point, but feel free to suggest tangentially related options too. Examples:
   - User likes Barre → also consider yoga studios, pilates, dance fitness (related body-shaping fitness).
   - User likes climbing → also consider bouldering communities, hiking clubs, outdoor adventure groups.
   - User likes books → also consider writing groups, library discussion series, indie magazine release events.
   The point is to broaden the user's exposure to nearby communities, not just exact-match their interests.
5. **Tile types**: use "organization" or "community" or "resource". Avoid "event" and "class".
6. **Image URLs**: include \`imageUrl\` when web search surfaces a real logo or representative photo (Wikipedia commons, the org's own .org/.com image, Reddit snoo for subreddits, etc.). Skip the field if you can't find a good one — the UI falls back to the emoji icon.
7. **Mix time-of-day across each goal's 3 tiles.** Most clubs/classes/meetups skew evening — aim for at least one morning-leaning pick per goal when one fits naturally, so the user's resulting weekly routine isn't all weekday evenings. Good morning-friendly examples: coffee shops to become a regular at, early run clubs, parkrun chapters, yoga / pilates studios with morning classes, weekend brunch communities, indie bookstores with morning hours, breakfast meetups, libraries with weekday-morning programs. Do NOT force morning where it's unnatural — a chess club that genuinely only meets at 7pm should stay 7pm. Just avoid 3-out-of-3 evening picks per goal when valid morning alternatives exist. When listing the schedule, use specific times ("Saturdays 8am", "Tue/Thu 6:30am", "Daily 7am–4pm") rather than vague phrases like "weekly" so the routine slotting downstream can tell morning from evening.

Use the user's social style + budget + has-car to bias picks. Skew higher-cost suggestions for high-budget users, social/extroverted picks for extroverts, walking-distance picks for no-car users, etc.

OUTPUT FORMAT: a single \`\`\`json fence containing an array of objects. No prose outside the fence.

Each object shape:
{
  "id": "kebab-case-slug-of-org-name-and-city",
  "cluster": "EXACT goal text from user (e.g. 'Make new friends')",
  "title": "Short name (≤60 chars) — the actual org name, not a generic label",
  "type": "organization" | "community" | "resource",
  "icon": "single emoji that fits",
  "imageUrl": "https://..." | omitted,
  "shortDescription": "≤90 chars, one specific concrete sentence",
  "longDescription": "2-3 sentences. What it is, what recurring activity to expect, what's special about it. Mention how it connects to the user's interests or adjacent fields if applicable.",
  "links": [{ "label": "Short label", "url": "https://..." }],
  "meta": {
    "cost": "Free" | "$15/class" | "$60/mo" | etc.,
    "schedule": "Tuesdays 7pm" | "Saturdays 8am" | "Daily 6am–4pm" | etc.,
    "location": "neighborhood / address hint" | omitted,
    "howToJoin": "One-line how-to (RSVP at link, show up, fill form, etc.)"
  },
  "matchedInterest": "one of the user's interests, or an adjacent one you considered" | omitted
}

VALIDATION: exactly 3 tiles per goal. Hard fail if any goal has fewer than 2 tiles or more than 4. The "cluster" field MUST match a user-provided goal string exactly.`;

function buildUserPrompt(profile: Profile): string {
  const interests = profile.interests.join(", ") || "(none listed)";
  const goalsList = profile.goals
    .map((g, i) => `  ${i + 1}. "${g}"`)
    .join("\n");
  const neighborhood = profile.neighborhood
    ? `Neighborhood: ${profile.neighborhood}\n`
    : "";
  const expectedCount = profile.goals.length * 3;

  return `Generate Month 1 "Try things" tiles for this user:

City: ${profile.city}
${neighborhood}Interests: ${interests}
Social style: ${profile.socialStyle}
Budget tier: ${profile.budgetTier}
Has car: ${profile.hasCar ? "yes" : "no"}

GOALS (${profile.goals.length}):
${goalsList}

For EACH goal above, produce exactly 3 tiles whose "cluster" field matches that goal's text exactly. Total tiles expected: ${expectedCount}. Bias the picks by the user's interests and adjacent/related fields. Use web search to ground each in a real local org or community in ${profile.city}.`;
}

async function callClaudeForMonth1(
  profile: Profile,
): Promise<Month1GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY not set. Add it to .env.local or flip USE_FAKE_AI=true.",
    );
  }
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(profile) }],
    // Month 1 covers 4 city-specific clusters → ~1 search per cluster.
    // 6 gives room for 1-2 extra targeted searches without ballooning time.
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 6,
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

  const tiles = parseAndValidateTiles(text, new Set(profile.goals));

  return {
    tiles,
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
// "Load more" — on-demand, single-goal expansion (not cached)
// ============================================================
// Triggered by a per-goal button on /plan. Always runs fresh (no
// readCachedSuggestions / writeCachedSuggestions) so a refresh resets
// the user back to the default tile set. Still counts toward the per-
// user daily generation limit so it can't be spammed across sessions.

export async function generateMoreTilesForGoal(
  userId: string,
  profile: Profile,
  goal: string,
  excludeIds: string[],
): Promise<SurfaceResult<AiMonth1Tile[]>> {
  if (!profile.goals.includes(goal)) {
    return { status: "failed", data: [] };
  }

  const surface = "month_1" as const;

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
    return { status: "failed", data: [] };
  }

  try {
    const result = USE_FAKE_AI
      ? buildMockMoreTiles(profile, goal, excludeIds)
      : await callClaudeForMoreTiles(profile, goal, excludeIds);
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
    return { status: "ok", data: result.tiles };
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
    return { status: "failed", data: [] };
  }
}

function buildMockMoreTiles(
  profile: Profile,
  goal: string,
  excludeIds: string[],
): Month1GenerationResult {
  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const interest = profile.interests[0] ?? "exploring";
  const startIndex = excludeIds.length;

  const tiles: AiMonth1Tile[] = Array.from({ length: 3 }, (_, i) => {
    const n = startIndex + i + 1;
    return {
      id: `mock-more-${slug(goal)}-${n}-${slug(profile.city)}`,
      cluster: goal,
      title: `[Mock] More ${goal} pick ${n} (${profile.city})`,
      type: "organization" as const,
      icon: "🆕",
      imageUrl: undefined,
      shortDescription: `Additional mock for "${goal}" in ${profile.city}.`,
      longDescription: `[Mock load-more for ${profile.city}] These tiles are generated on demand and aren't cached — refresh resets them. Real Claude output replaces this.`,
      links: [],
      meta: {
        cost: "—",
        schedule: "Weekly",
        howToJoin: "Mock — real instructions appear with real AI.",
      },
      matchedInterest: interest,
    };
  });

  return {
    tiles,
    meta: {
      model: "mock",
      inputTokens: 0,
      outputTokens: 0,
      searchCount: 0,
      cacheHit: false,
    },
  };
}

async function callClaudeForMoreTiles(
  profile: Profile,
  goal: string,
  excludeIds: string[],
): Promise<Month1GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY not set. Add it to .env.local or flip USE_FAKE_AI=true.",
    );
  }
  const client = new Anthropic({ apiKey });

  const interests = profile.interests.join(", ") || "(none listed)";
  const neighborhood = profile.neighborhood
    ? `Neighborhood: ${profile.neighborhood}\n`
    : "";
  const excludeBlock =
    excludeIds.length > 0
      ? `\nALREADY SHOWN (do not repeat these IDs, and pick different orgs):\n${excludeIds.map((id) => `  - ${id}`).join("\n")}\n`
      : "";

  const userPrompt = `Generate 3 ADDITIONAL Month 1 "Try things" tiles for one specific goal.

City: ${profile.city}
${neighborhood}Interests: ${interests}
Social style: ${profile.socialStyle}
Budget tier: ${profile.budgetTier}
Has car: ${profile.hasCar ? "yes" : "no"}

Goal to expand on: "${goal}"
${excludeBlock}
Produce exactly 3 tiles whose "cluster" field equals "${goal}" verbatim. These are EXTRA options the user requested after already seeing the defaults — prioritize variety: different orgs, different neighborhoods, different sub-flavors of the goal. Use web search to ground each in a real local org or community in ${profile.city}.`;

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
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

  const excludeSet = new Set(excludeIds);
  const tiles = parseAndValidateTiles(text, new Set([goal])).filter(
    (t) => !excludeSet.has(t.id),
  );

  return {
    tiles,
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
// Backfill — replace a kept tile with a fresh one in the same goal
// ============================================================
// Called from setKeeperStateAction when the user clicks "Keep it" on a
// Month 1 AI tile. The kept tile disappears from "Try things" (rendered
// as keptState="keep" → filtered out at render time in Month1Section).
// This function fetches one fresh tile for the same goal and appends
// it to the cache so the user always sees three tiles per goal.
//
// Best-effort: fails silently on no-cache / daily-limit / generation
// error. The Keep action itself never fails because the backfill did —
// the user keeps the tile either way; they just don't get a replacement.
export async function backfillKeptMonth1Tile(
  userId: string,
  profile: Profile,
  keptTileId: string,
): Promise<void> {
  const surface = "month_1" as const;
  const fingerprint = profileFingerprint(profile, surface);

  const cached = await readCachedSuggestions(userId, surface, fingerprint);
  if (!cached) return;

  const existingTiles = cached.content as unknown as AiMonth1Tile[];
  const keptTile = existingTiles.find((t) => t.id === keptTileId);
  if (!keptTile) return;
  const goal = keptTile.cluster;
  if (!profile.goals.includes(goal)) return;

  const excludeIds = existingTiles.map((t) => t.id);
  const result = await generateMoreTilesForGoal(
    userId,
    profile,
    goal,
    excludeIds,
  );
  if (result.status !== "ok" || result.data.length === 0) return;

  // Pick the first fresh tile. We only need one — the others would
  // bloat the cache. The 1-tile generation cost is the same as the
  // 3-tile cost (single Claude turn with web_search), so this is fine.
  const newTile = result.data[0];
  const augmented = [...existingTiles, newTile];

  // Insert as a new cache row. readCachedSuggestions picks the most
  // recent, so this superceds the previous content array.
  try {
    await writeCachedSuggestions({
      userId,
      surface,
      profileHash: fingerprint,
      suggestions: augmented as unknown as AiSuggestion[],
      model: cached.model,
      inputTokens: 0,
      outputTokens: 0,
      searchCount: 0,
    });
  } catch {
    // Same best-effort posture as the surrounding flow.
  }
}

// ============================================================
// JSON extraction + validation
// ============================================================

function parseAndValidateTiles(
  text: string,
  allowedClusters: Set<string>,
): AiMonth1Tile[] {
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

  const out: AiMonth1Tile[] = [];
  for (const raw of parsed) {
    const t = validateTile(raw, allowedClusters);
    if (t) out.push(t);
  }
  if (out.length === 0) {
    throw new Error("Model returned 0 valid Month 1 tiles.");
  }
  return out;
}

function validateTile(
  raw: unknown,
  allowedClusters: Set<string>,
): AiMonth1Tile | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === "string" ? r.id : null;
  const title = typeof r.title === "string" ? r.title : null;
  // Cluster must match one of the user's goals verbatim. The model is
  // told to use exact text; we enforce here.
  const cluster =
    typeof r.cluster === "string" && allowedClusters.has(r.cluster)
      ? (r.cluster as AiMonth1Cluster)
      : null;
  const type =
    typeof r.type === "string" && VALID_TYPES.has(r.type as ForYouItemType)
      ? (r.type as ForYouItemType)
      : null;
  const icon = typeof r.icon === "string" ? r.icon : "✨";
  const imageUrl =
    typeof r.imageUrl === "string" && r.imageUrl.startsWith("http")
      ? r.imageUrl
      : undefined;
  const shortDescription =
    typeof r.shortDescription === "string" ? r.shortDescription : null;
  const longDescription =
    typeof r.longDescription === "string" ? r.longDescription : "";
  const matchedInterest =
    typeof r.matchedInterest === "string" ? r.matchedInterest : undefined;

  if (!id || !title || !cluster || !type || !shortDescription) {
    return null;
  }

  const links = Array.isArray(r.links)
    ? r.links
        .map((l) => {
          if (typeof l !== "object" || l === null) return null;
          const lr = l as Record<string, unknown>;
          if (typeof lr.label !== "string" || typeof lr.url !== "string") {
            return null;
          }
          return { label: stripCitations(lr.label), url: lr.url };
        })
        .filter((x): x is { label: string; url: string } => x !== null)
    : [];

  const meta =
    typeof r.meta === "object" && r.meta !== null
      ? (() => {
          const mr = r.meta as Record<string, unknown>;
          const out: {
            cost?: string;
            schedule?: string;
            location?: string;
            howToJoin?: string;
          } = {};
          if (typeof mr.cost === "string") out.cost = stripCitations(mr.cost);
          if (typeof mr.schedule === "string")
            out.schedule = stripCitations(mr.schedule);
          if (typeof mr.location === "string")
            out.location = stripCitations(mr.location);
          if (typeof mr.howToJoin === "string")
            out.howToJoin = stripCitations(mr.howToJoin);
          return Object.keys(out).length > 0 ? out : undefined;
        })()
      : undefined;

  return {
    id,
    cluster,
    title: stripCitations(title),
    type,
    icon,
    imageUrl,
    shortDescription: stripCitations(shortDescription),
    longDescription: stripCitations(longDescription),
    links,
    meta,
    matchedInterest: stripCitationsOptional(matchedInterest),
  };
}
