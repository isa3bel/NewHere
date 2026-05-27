import type { ForYouItem } from "./for-you-data";
import type { SavedItemState } from "./types";

// A For You tile a user has pinned. We store the full ForYouItem snapshot
// so the user keeps what they saved even if the live data changes or the
// underlying interest is removed from their profile.
export type SavedItem = {
  forYouItemId: string;
  userId: string;
  snapshot: ForYouItem;
  interest: string;
  state: SavedItemState;
  savedAt: string;
};
