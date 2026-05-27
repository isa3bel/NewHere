import { getForYouItems } from "./for-you-data";
import type { ForYouItem } from "./for-you-data";
import type { Task } from "./types";

// Maps a task to up to N related For You items based on the user's interests.
// Used by the task detail panel to surface concrete, local discoveries inline
// — the slot where AI + web search results will eventually plug in.
//
// Matching strategy:
//   1. If the task title or ID mentions one of the user's interests
//      (or a synonym), pull from that interest's curated tiles.
//   2. Else if the task category is community / hobby / exploration and
//      the user has at least one interest, pull from their first interest.
//   3. Else return empty — essentials and admin tasks don't need recs.

const TASK_KEYWORDS_TO_INTEREST: { keywords: string[]; interest: string }[] = [
  { keywords: ["climb", "boulder"], interest: "climbing" },
  { keywords: ["coffee", "cafe", "barista"], interest: "coffee" },
  { keywords: ["book", "library", "read"], interest: "books" },
  { keywords: ["run", "running", "jog"], interest: "running" },
  { keywords: ["yoga", "studio"], interest: "yoga" },
  { keywords: ["volunteer", "giving back"], interest: "volunteering" },
];

function inferInterestFromTask(task: Task): string | null {
  const haystack = `${task.id} ${task.title}`.toLowerCase();
  for (const { keywords, interest } of TASK_KEYWORDS_TO_INTEREST) {
    if (keywords.some((k) => haystack.includes(k))) return interest;
  }
  return null;
}

export function relatedDiscoveries(
  task: Task,
  userInterests: string[],
  limit = 2,
): ForYouItem[] {
  const inferred = inferInterestFromTask(task);
  const matchedInterest = inferred && userInterests.includes(inferred) ? inferred : inferred;

  if (matchedInterest) {
    return getForYouItems(matchedInterest).slice(0, limit);
  }

  if (
    (task.category === "community" ||
      task.category === "hobby" ||
      task.category === "exploration") &&
    userInterests.length > 0
  ) {
    return getForYouItems(userInterests[0]).slice(0, limit);
  }

  return [];
}
