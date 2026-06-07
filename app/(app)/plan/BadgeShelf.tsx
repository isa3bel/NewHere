import type { Badge } from "@/lib/types";

// Persistent shelf of every badge — earned ones in full color with the
// accent border, unearned ones dimmed + grayscaled so the user can see
// what's next.
//
// Sits above PlanView on both /plan and /sample. CelebrationBanner
// still pops on top when a badge was *just* earned (cookie-flagged);
// this shelf is the always-visible "collection" view.
export function BadgeShelf({
  badges,
  earnedIds,
}: {
  badges: Badge[];
  earnedIds: Set<string>;
}) {
  if (badges.length === 0) return null;
  const earnedCount = badges.filter((b) => earnedIds.has(b.id)).length;

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          Badges
        </h2>
        <span className="text-xs text-[var(--muted-foreground)]">
          {earnedCount} of {badges.length} earned
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {badges.map((b) => {
          const earned = earnedIds.has(b.id);
          return (
            <li
              key={b.id}
              title={
                earned
                  ? `Earned — ${b.description}`
                  : `Locked — ${b.description}`
              }
              className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2 transition ${
                earned
                  ? "border-[var(--accent)] bg-[var(--card)]"
                  : "border-[var(--border)] bg-[var(--background)] opacity-60"
              }`}
            >
              <span
                className={`text-2xl leading-none ${earned ? "" : "grayscale"}`}
                aria-hidden
              >
                {b.icon ?? "🏅"}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold leading-tight">
                  {b.name}
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] leading-tight mt-0.5 max-w-[14rem] truncate">
                  {b.description}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
