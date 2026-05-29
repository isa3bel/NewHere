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

// Return shape from the top-level surface fetchers. `status` lets the
// caller distinguish between "AI succeeded (with possibly empty results)"
// and "AI failed and we fell back to empty" — without it the page can't
// tell whether to show a failure banner. `data` is what gets rendered.
export type SurfaceResult<T> = {
  status: "ok" | "failed";
  data: T;
};

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

// ============================================================
// Month 1 "Try things" tile shape
// ============================================================
// Unlike Week 1 (which overlays static slots), Month 1 fully replaces
// the surface with AI-generated tiles. Each tile is a real local
// organization or community with recurring activities — never a one-off
// event unless it's tied to an org that hosts repeat events.
//
// Tiles are grouped into the same 4 outcome clusters as the existing UX
// (community / hobby / routine / exploration). The page renders them
// per cluster with the cluster-specific framing.

// Cluster is now the user's GOAL label (e.g. "Make new friends", or a
// custom string the user typed in onboarding). Up to 3 per profile.
// We don't constrain to a union — that would invalidate the cache every
// time the GOAL_TAGS list changes.
export type AiMonth1Cluster = string;

export type AiMonth1Tile = {
  id: string;                  // stable slug like "sf-bay-area-bouldering-coalition"
  cluster: AiMonth1Cluster;    // the user's goal label this tile maps to
  title: string;
  type: ForYouItemType;        // community / organization / resource (avoid event/class)
  icon: string;                // fallback emoji shown when imageUrl absent or fails to load
  imageUrl?: string;           // logo or representative photo from the web (optional)
  shortDescription: string;
  longDescription: string;
  links: { label: string; url: string }[];
  meta?: {
    cost?: string;
    schedule?: string;        // recurring cadence (e.g. "Wednesdays at 6:30pm")
    location?: string;
    howToJoin?: string;       // one-line "how do I get started"
  };
  matchedInterest?: string;    // optional — which user interest steered this pick
};

// Adapter so the existing addForYouToPlanAction / markForYouCompletedAction
// can accept Month 1 tiles directly (they expect a ForYouItem shape).
export function month1TileToForYouItem(tile: AiMonth1Tile): ForYouItem {
  return {
    id: tile.id,
    title: tile.title,
    type: tile.type,
    icon: tile.icon,
    shortDescription: tile.shortDescription,
    longDescription: tile.longDescription,
    links: tile.links,
    meta: tile.meta
      ? {
          cost: tile.meta.cost,
          schedule: tile.meta.schedule,
          location: tile.meta.location,
        }
      : undefined,
  };
}
