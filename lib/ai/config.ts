// Central knobs for the AI layer. Anything that affects cost, model
// choice, or kill-switching lives here so it's easy to find later.

// Master kill switch. When true, generators return mock data and skip
// the network entirely. Used during development and as an emergency
// fallback. Defaults to true so a misconfigured deploy fails *safe*
// (no surprise bills) — flip explicitly when you're ready to spend.
export const USE_FAKE_AI = process.env.USE_FAKE_AI !== "false";

// Hard ceiling on how many regenerations a single user can trigger
// per day. Independent of Anthropic's account-level spend cap — this
// catches a runaway client loop before it ever reaches the API.
// At 5/day a real user has plenty of headroom for normal use
// (onboarding + a couple of profile edits), but a runaway can't drain
// the account. Bump this up if it becomes a real-user pain point.
export const PER_USER_DAILY_GENERATION_LIMIT = 5;

// Model used when USE_FAKE_AI is false. Haiku is plenty for generating
// suggestion-style content and ~3x cheaper than Sonnet.
export const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

// Per-million-token pricing in cents. Used to populate the
// estimated_cost_cents column in ai_generations so cost can be
// summed without re-pricing historical rows. Update if pricing changes.
export const TOKEN_PRICE_CENTS_PER_MILLION = {
  // Claude Haiku 4.5 list price as of writing
  "claude-haiku-4-5-20251001": { input: 100, output: 500 },
  // Mock costs zero — we still log rows so the dashboard can show
  // call counts during development.
  mock: { input: 0, output: 0 },
} as const;

// Web search tool cost (Anthropic charges per search regardless of model).
export const SEARCH_PRICE_CENTS = 1; // $0.01 per search ($10 / 1,000)

export function estimateCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number,
  searchCount: number,
): number {
  const price =
    TOKEN_PRICE_CENTS_PER_MILLION[
      model as keyof typeof TOKEN_PRICE_CENTS_PER_MILLION
    ] ?? TOKEN_PRICE_CENTS_PER_MILLION.mock;
  const inputCost = (inputTokens / 1_000_000) * price.input;
  const outputCost = (outputTokens / 1_000_000) * price.output;
  const searchCost = searchCount * SEARCH_PRICE_CENTS;
  return Math.ceil(inputCost + outputCost + searchCost);
}
