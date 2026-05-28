import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  estimateCostCents,
  PER_ADMIN_DAILY_GENERATION_LIMIT,
  PER_USER_DAILY_GENERATION_LIMIT,
} from "./config";
import type { AiSurface } from "./types";

// Records a row in ai_generations. Called on every call (including
// cache hits — they record 0 tokens). Failures here are swallowed; we
// never want a logging error to break a user-facing request.
//
// Service-role client because clients can SELECT but not INSERT
// into ai_generations (same pattern as user_badges).
export async function logAiGeneration(args: {
  userId: string;
  surface: AiSurface;
  model: string;
  cacheHit: boolean;
  inputTokens: number;
  outputTokens: number;
  searchCount: number;
  succeeded: boolean;
  errorMessage?: string;
}): Promise<void> {
  const cost = estimateCostCents(
    args.model,
    args.inputTokens,
    args.outputTokens,
    args.searchCount,
  );
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("ai_generations").insert({
    user_id: args.userId,
    surface: args.surface,
    model: args.model,
    cache_hit: args.cacheHit,
    input_tokens: args.inputTokens,
    output_tokens: args.outputTokens,
    search_count: args.searchCount,
    estimated_cost_cents: cost,
    succeeded: args.succeeded,
    error_message: args.errorMessage ?? null,
  });
  if (error) {
    // Don't throw — logging is best-effort.
    console.warn("[ai/usage-log] insert failed:", error.message);
  }
}

// Returns true if the user is below their daily regeneration ceiling.
// Only counts *real, successful* generations:
//   - cache_hit=false  → cache hits are free, don't count
//   - model != 'mock'  → mock generations are free, don't count
//   - succeeded=true   → failed attempts (including prior limit-exceeded
//                        log rows) shouldn't make the user permanently
//                        capped for the rest of the day
//
// Admins (ADMIN_EMAILS) get a much higher cap so iteration isn't
// blocked. Anthropic's account-level spend cap is the ultimate backstop.
export async function isUnderDailyLimit(userId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const [countResult, isAdmin] = await Promise.all([
    admin
      .from("ai_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("cache_hit", false)
      .eq("succeeded", true)
      .neq("model", "mock")
      .gte("created_at", since.toISOString()),
    isAdminUser(userId),
  ]);

  if (countResult.error) {
    // On error, fail open — better to allow a generation than to
    // accidentally block all users because of a transient DB issue.
    return true;
  }
  const limit = isAdmin
    ? PER_ADMIN_DAILY_GENERATION_LIMIT
    : PER_USER_DAILY_GENERATION_LIMIT;
  return (countResult.count ?? 0) < limit;
}

// Looks up the user's email and matches against ADMIN_EMAILS. Returns
// false on any error (fail closed: an unknown user gets the strict
// real-user cap, not the admin cap).
async function isAdminUser(userId: string): Promise<boolean> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const admins = new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  );
  if (admins.size === 0) return false;
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) return false;
    return admins.has(data.user.email.toLowerCase());
  } catch {
    return false;
  }
}
