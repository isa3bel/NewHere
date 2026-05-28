import type { ForYouItem, ForYouItemType } from "@/lib/for-you-data";

// The shape every AI surface produces. Designed to be a superset of
// ForYouItem so existing renderers (PreMoveRow, future tile components)
// can consume cached AI output unchanged.
//
// Keep this stable — it's what the Claude prompt will be asked to
// produce. Adding a *new* optional field is cheap; renaming or removing
// a field invalidates the cache for every user.
export type AiSuggestion = {
  id: string;                    // stable across regenerations for the same content
  title: string;
  type: ForYouItemType;
  icon: string;
  shortDescription: string;
  longDescription: string;
  date?: string;                 // event/class only
  links: { label: string; url: string }[];
  meta?: { cost?: string; schedule?: string; location?: string };
  // AI-only fields (mock leaves these absent or synthetic)
  matchedInterest: string;       // which user interest this maps to
  confidence?: "high" | "medium" | "low"; // model's self-rating, optional
};

// Conversion helper for code paths that still want a ForYouItem.
// AiSuggestion is a superset, so this is a structural identity narrow.
export function toForYouItem(s: AiSuggestion): ForYouItem {
  const { matchedInterest: _, confidence: __, ...rest } = s;
  void _; void __;
  return rest;
}

// Result returned by generate*() — separates the user-facing content
// from the bookkeeping that goes into ai_generations.
export type GenerationResult = {
  suggestions: AiSuggestion[];
  meta: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    searchCount: number;
    cacheHit: boolean;
  };
};

// All surfaces that can be cached. Add to this union when adding a new
// AI-backed surface (month_1, deepening:<anchorId>, etc.).
export type AiSurface = "pre_move" | "week_one" | "month_1";

// ============================================================
// Week 1 "Land & settle" overlay shape
// ============================================================
// Each Week 1 task has a stable slot key matching its mockTasks id
// (e.g., "w1-license", "w1-transit"). AI fills in city-specific titles
// and detailed how-to content per slot. Stored as one row in
// ai_suggestions per (user, profile_hash) with content = AiWeekOneDetail[].

export type AiTaskStep = {
  title: string;
  body?: string;
  link?: { url: string; label: string };
};

export type AiTaskResource = {
  url: string;
  label: string;
  description?: string;
};

export type AiTaskGuide = {
  estimatedTime?: string;
  overview?: string;
  steps: AiTaskStep[];
  resources?: AiTaskResource[];
};

export type AiWeekOneDetail = {
  slotKey: string;             // stable id matching mockTasks (e.g. "w1-license")
  titleOverride?: string;      // city-specific replacement title
  descriptionOverride?: string; // city-specific replacement description
  guide: AiTaskGuide;          // detailed right-panel content
};
