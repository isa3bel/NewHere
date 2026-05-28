import { createHash } from "node:crypto";

import type { Profile } from "@/lib/types";

import type { AiSurface } from "./types";

// Deterministic hash of the profile fields that affect generated output.
// Same inputs → same fingerprint → cache hit. Anything not in this list
// (display name, has_car, etc.) won't invalidate the cache.
//
// `surface` is included so pre_move and month_1 get different hashes
// even for the same profile — each surface is a different prompt.
export function profileFingerprint(
  profile: Profile,
  surface: AiSurface,
): string {
  // Normalize empty/whitespace/null to a single canonical null so they
  // all produce the same fingerprint — otherwise "" and null would each
  // get their own cached row.
  const neighborhood = profile.neighborhood?.trim().toLowerCase() || null;
  const payload = {
    surface,
    city: profile.city.trim().toLowerCase(),
    neighborhood,
    socialStyle: profile.socialStyle,
    budgetTier: profile.budgetTier,
    interests: [...profile.interests].map((s) => s.toLowerCase()).sort(),
    goals: [...profile.goals].sort(),
  };
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 16);
}
