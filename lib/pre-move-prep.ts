import { getForYouItems, type ForYouItem } from "./for-you-data";
import type { Profile } from "./types";

// "Prepare for your move" suggestions for users whose move date is in the
// future. Surfaces research/community/long-term items from their interests
// — explicitly not events or classes, which require being in the city.
//
// When AI + web search is wired up later, this is the natural place to
// generate city-specific prep prompts (e.g. "Read r/Austin's moving FAQ",
// "Browse the Austin newcomers Facebook group").
export type PreMoveSuggestion = { item: ForYouItem; interest: string };

export function generatePreMoveSuggestions(
  profile: Profile | null,
): PreMoveSuggestion[] {
  const interests = profile?.interests ?? [];
  if (interests.length === 0) return [];

  const out: PreMoveSuggestion[] = [];
  const seen = new Set<string>();

  for (const interest of interests) {
    const items = getForYouItems(interest);
    // Anything non-event-ish: organizations, communities, resources. These
    // are things you can read, bookmark, or join online before you arrive.
    const prep = items.filter(
      (i) => i.type !== "event" && i.type !== "class",
    );
    for (const item of prep.slice(0, 2)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push({ item, interest });
    }
  }

  return out.slice(0, 6);
}
