import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { AiSuggestion, AiSurface } from "./types";

type CachedRow = {
  content: AiSuggestion[];
  model: string;
  generated_at: string;
};

// Most recent cached suggestions for a (user, surface, fingerprint) tuple.
// Returns null if no row exists. Uses admin client because RLS would allow
// the SELECT but we want consistent behavior whether called from a server
// action (user context) or a background job (no user context).
export async function readCachedSuggestions(
  userId: string,
  surface: AiSurface,
  profileHash: string,
): Promise<CachedRow | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_suggestions")
    .select("content, model, generated_at")
    .eq("user_id", userId)
    .eq("surface", surface)
    .eq("profile_hash", profileHash)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as CachedRow;
}

// Inserts a new cache row. We never overwrite — each regeneration produces
// a new row so history is preserved. The lookup query picks the most
// recent for a given fingerprint, so older rows naturally fall out of use.
export async function writeCachedSuggestions(args: {
  userId: string;
  surface: AiSurface;
  profileHash: string;
  suggestions: AiSuggestion[];
  model: string;
  inputTokens: number;
  outputTokens: number;
  searchCount: number;
}): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("ai_suggestions").insert({
    user_id: args.userId,
    surface: args.surface,
    profile_hash: args.profileHash,
    content: args.suggestions,
    model: args.model,
    input_tokens: args.inputTokens,
    output_tokens: args.outputTokens,
    search_count: args.searchCount,
  });
  if (error) {
    throw new Error(`writeCachedSuggestions failed: ${error.message}`);
  }
}

// Invalidates the cache for a (user, surface) pair by deleting all rows
// regardless of fingerprint. Called when the user explicitly hits
// "Refresh" — the next call will be a guaranteed cache miss.
export async function invalidateCachedSuggestions(
  userId: string,
  surface: AiSurface,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  await admin
    .from("ai_suggestions")
    .delete()
    .eq("user_id", userId)
    .eq("surface", surface);
}
