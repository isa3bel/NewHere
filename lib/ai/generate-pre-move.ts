import Anthropic from "@anthropic-ai/sdk";

import { getForYouItems } from "@/lib/for-you-data";
import type { ForYouItemType } from "@/lib/for-you-data";
import type { Profile } from "@/lib/types";

import { readCachedSuggestions, writeCachedSuggestions } from "./cache";
import { ANTHROPIC_MODEL, USE_FAKE_AI } from "./config";
import { profileFingerprint } from "./fingerprint";
import { stripCitations } from "./sanitize";
import type { AiSuggestion, GenerationResult } from "./types";
import { isUnderDailyLimit, logAiGeneration } from "./usage-log";

// ============================================================
// Public entry point for the plan page
// ============================================================

// Top-level entry: check cache → generate → log → persist.
// Returns [] on any failure (logged in ai_generations as succeeded=false).
export async function getOrGeneratePreMoveSuggestions(
  userId: string,
  profile: Profile,
): Promise<AiSuggestion[]> {
  if ((profile.interests ?? []).length === 0) return [];

  const surface = "pre_move" as const;
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
    return cached.content;
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
    const result = await generatePreMoveSuggestions(profile);
    await writeCachedSuggestions({
      userId,
      surface,
      profileHash: fingerprint,
      suggestions: result.suggestions,
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
    return result.suggestions;
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
// Generator (mock or real Claude based on USE_FAKE_AI)
// ============================================================

async function generatePreMoveSuggestions(
  profile: Profile,
): Promise<GenerationResult> {
  if (USE_FAKE_AI) return buildMockSuggestions(profile);
  return callClaudeForPreMove(profile);
}

// ============================================================
// Mock — re-uses the static catalog so the renderer sees the
// same shape it'll see from real Claude.
// ============================================================

function buildMockSuggestions(profile: Profile): GenerationResult {
  const interests = profile.interests ?? [];
  const out: AiSuggestion[] = [];
  const seen = new Set<string>();

  for (const interest of interests) {
    const items = getForYouItems(interest);
    const prep = items.filter((i) => i.type !== "event" && i.type !== "class");
    for (const item of prep.slice(0, 2)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push({ ...item, matchedInterest: interest, confidence: "medium" });
    }
  }

  return {
    suggestions: out.slice(0, 6),
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

const SYSTEM_PROMPT = `You are a research assistant for NewHere, an app that helps people who have just moved to a new city get oriented.

Your job RIGHT NOW: generate "pre-move" suggestions for a user whose move is still in the future. These are things they can do online before they arrive — joining online communities, bookmarking organizations, reading local resources. Explicitly NOT in-person events or classes (those require being in the city).

You have access to web search. USE IT to find real, current, city-specific content. Don't generalize — search for things like "best running clubs Austin" or "Austin coffee community subreddit", not generic global resources. Prefer:
- Local subreddits, Discord servers, Facebook groups
- City-specific organizations and nonprofits
- Local newsletters, blogs, and event calendars
- Sport/hobby clubs with official memberships
- Volunteer organizations rooted in that city

Output format: a single JSON code fence containing an array of suggestion objects. No prose outside the fence. Each object must have these exact fields:

{
  "id": "kebab-case-slug",                 // short, stable, unique within this response
  "title": "Short title (≤60 chars)",
  "type": "organization" | "community" | "resource",  // NEVER "event" or "class" for pre-move
  "icon": "single emoji",
  "shortDescription": "One sentence, ≤90 chars",
  "longDescription": "2-3 sentences. What it is, how to engage with it before arriving, what to expect.",
  "links": [{ "label": "Short link label", "url": "https://..." }],
  "meta": { "cost": "Free" | "$X/month" | etc., "schedule": "..." } | omitted,
  "matchedInterest": "one of the user's listed interests"
}

Aim for 4-6 suggestions total, distributed across the user's interests. Each suggestion should be matched to exactly one interest from their list.`;

function buildUserPrompt(profile: Profile): string {
  const interests = profile.interests.join(", ") || "(none listed)";
  const goals = profile.goals.length > 0 ? profile.goals.join(", ") : "(none listed)";

  return `Generate pre-move suggestions for this user:

City: ${profile.city}
Interests: ${interests}
Social style: ${profile.socialStyle}
Budget tier: ${profile.budgetTier}
Goals: ${goals}

Use web search to find real, current, ${profile.city}-specific resources. Return JSON only, inside a single \`\`\`json code fence.`;
}

async function callClaudeForPreMove(
  profile: Profile,
): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY not set. Add it to .env.local or flip USE_FAKE_AI=true.",
    );
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(profile) }],
    // Server tool — Anthropic runs the searches and feeds results back
    // into the same response. Token cost is included in usage; search
    // cost is per-use (see config.ts).
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 4,
      },
    ],
  });

  // Concatenate all final text blocks. Web search adds intermediate
  // server_tool_use + web_search_tool_result blocks; the model's
  // human-readable output is in the text blocks after those.
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  // Count actual searches the model performed — drives audit log +
  // dashboard cost numbers.
  const searchCount = response.content.filter(
    (b) => b.type === "server_tool_use" && (b as { name?: string }).name === "web_search",
  ).length;

  const suggestions = parseAndValidateSuggestions(text);

  return {
    suggestions,
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

const VALID_TYPES = new Set<ForYouItemType>([
  "organization",
  "community",
  "resource",
  // event/class allowed by the type system but rejected for pre-move;
  // we'll silently drop them rather than throw, since the model might
  // slip one in despite the system prompt.
]);

function parseAndValidateSuggestions(text: string): AiSuggestion[] {
  // Pull the first ```json ... ``` block. Fallback: try the whole text
  // in case the model omitted the fence.
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

  const out: AiSuggestion[] = [];
  for (const raw of parsed) {
    const s = validateSuggestion(raw);
    if (s) out.push(s);
  }
  if (out.length === 0) {
    throw new Error("Model returned 0 valid suggestions.");
  }
  return out;
}

function validateSuggestion(raw: unknown): AiSuggestion | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r.id === "string" ? r.id : null;
  const title = typeof r.title === "string" ? r.title : null;
  const type =
    typeof r.type === "string" && VALID_TYPES.has(r.type as ForYouItemType)
      ? (r.type as ForYouItemType)
      : null;
  const icon = typeof r.icon === "string" ? r.icon : "🌱";
  const shortDescription =
    typeof r.shortDescription === "string" ? r.shortDescription : null;
  const longDescription =
    typeof r.longDescription === "string" ? r.longDescription : "";
  const matchedInterest =
    typeof r.matchedInterest === "string" ? r.matchedInterest : null;

  if (!id || !title || !type || !shortDescription || !matchedInterest) {
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
          return { label: lr.label, url: lr.url };
        })
        .filter((x): x is { label: string; url: string } => x !== null)
    : [];

  const meta =
    typeof r.meta === "object" && r.meta !== null
      ? (() => {
          const mr = r.meta as Record<string, unknown>;
          const out: { cost?: string; schedule?: string; location?: string } = {};
          if (typeof mr.cost === "string") out.cost = mr.cost;
          if (typeof mr.schedule === "string") out.schedule = mr.schedule;
          if (typeof mr.location === "string") out.location = mr.location;
          return Object.keys(out).length > 0 ? out : undefined;
        })()
      : undefined;

  return {
    id,
    title: stripCitations(title),
    type,
    icon,
    shortDescription: stripCitations(shortDescription),
    longDescription: stripCitations(longDescription),
    links: links.map((l) => ({ ...l, label: stripCitations(l.label) })),
    meta: meta
      ? {
          cost: meta.cost ? stripCitations(meta.cost) : undefined,
          schedule: meta.schedule ? stripCitations(meta.schedule) : undefined,
          location: meta.location ? stripCitations(meta.location) : undefined,
        }
      : undefined,
    matchedInterest,
  };
}
