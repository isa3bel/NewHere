import Link from "next/link";

import { dismissCelebrationAction } from "@/app/actions";

import { AiFailureBanner } from "./AiFailureBanner";
import { BadgeShelf } from "./BadgeShelf";
import { DailyLimitBanner } from "./DailyLimitBanner";

// Vercel default function timeout is 10s on Hobby, 15s on Pro. Real
// Claude calls with web_search routinely take 15–30s, so we bump it.
// 60s is the Hobby ceiling; Pro can go higher. Per Next.js docs this
// also covers Server Actions invoked from this page (e.g. the
// "Refresh suggestions" button → refreshAiSuggestionsAction).
export const maxDuration = 60;
import { PlanView } from "./PlanView";
import type { PreMoveTile } from "./PlanView";
import { ensureMonth1TilesAreBackfilled } from "@/lib/ai/generate-month-one";
import { getOrGeneratePreMoveSuggestions } from "@/lib/ai/generate-pre-move";
import { getOrGenerateWeekOneOverlay } from "@/lib/ai/generate-week-one";
import { toForYouItem } from "@/lib/ai/types";
import type {
  AiMonth1Tile,
  AiSuggestion,
  AiWeekOneDetail,
} from "@/lib/ai/types";
import { requireUser } from "@/lib/auth";
import { readCelebrationBadgeIds } from "@/lib/celebration";
import {
  getActivePlan,
  getBadges,
  getProfile,
  getTasksForPlan,
  getUserBadges,
} from "@/lib/db";
import {
  daysSinceMove,
  getTodaysFocus,
  moveSummary,
} from "@/lib/plan-progress";
import { getDailyUsage } from "@/lib/ai/usage-log";
import type { Badge, KeeperState } from "@/lib/types";

export default async function PlanPage() {
  const user = await requireUser();
  const [profile, plan, badges, userBadges, dailyUsage] = await Promise.all([
    getProfile(user.id),
    getActivePlan(user.id),
    getBadges(),
    getUserBadges(user.id),
    getDailyUsage(user.id),
  ]);
  const atDailyLimit = dailyUsage.count >= dailyUsage.limit;
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  if (!plan) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-3">No active plan yet</h1>
          <p className="text-[var(--muted-foreground)] mb-6">
            Answer a few questions and we&apos;ll build one for you.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-6 text-[var(--accent-foreground)] font-medium"
          >
            Start onboarding
          </Link>
        </div>
      </main>
    );
  }

  const tasks = await getTasksForPlan(plan.id);

  const celebrationIds = await readCelebrationBadgeIds();
  const celebratingBadges = badges.filter((b) => celebrationIds.includes(b.id));

  const currentDay = profile?.moveDate ? daysSinceMove(profile.moveDate) : 0;
  const todaysFocus = getTodaysFocus(tasks, currentDay);
  const summary = moveSummary(currentDay);

  const notForMeItemIds = new Set<string>();
  const completedItemIds = new Set<string>();
  // Lookup so Month 1 AI tiles (initial AND client-side load-more extras)
  // can find their backing task to render the keep/maybe/not-for-me
  // prompt after the user clicks done.
  const month1TaskMap: Record<
    string,
    { taskId: string; keeperState: KeeperState }
  > = {};
  for (const t of tasks) {
    if (!t.sourceItemId) continue;
    if (t.status === "done") completedItemIds.add(t.sourceItemId);
    if (t.keeperState === "not_for_me") notForMeItemIds.add(t.sourceItemId);
    month1TaskMap[t.sourceItemId] = {
      taskId: t.id,
      keeperState: t.keeperState,
    };
  }

  // Three AI surfaces in parallel — total render time is max() of the
  // three rather than their sum. Each is independent.
  const [preMoveResult, weekOneResult, month1Result] = await Promise.all([
    profile && currentDay < 0
      ? getOrGeneratePreMoveSuggestions(user.id, profile)
      : Promise.resolve({ status: "ok", data: [] as AiSuggestion[] } as const),
    profile
      ? getOrGenerateWeekOneOverlay(user.id, profile)
      : Promise.resolve({
          status: "ok",
          data: [] as AiWeekOneDetail[],
        } as const),
    profile
      ? ensureMonth1TilesAreBackfilled(user.id, profile, tasks)
      : Promise.resolve({ status: "ok", data: [] as AiMonth1Tile[] } as const),
  ]);

  const aiFailed =
    preMoveResult.status === "failed" ||
    weekOneResult.status === "failed" ||
    month1Result.status === "failed";
  const weekOneOverlay = weekOneResult.data;
  const month1Tiles = month1Result.data;

  const preMoveSuggestions: PreMoveTile[] = preMoveResult.data
    .filter((s) => !notForMeItemIds.has(s.id))
    .map((s) => ({
      item: toForYouItem(s),
      interest: s.matchedInterest,
      completed: completedItemIds.has(s.id),
    }));

  const month1Suggestions = month1Tiles
    .filter((t) => !notForMeItemIds.has(t.id))
    .map((t) => ({
      tile: t,
      completed: completedItemIds.has(t.id),
    }));

  return (
    <main className="flex flex-col flex-1 items-center">
      <div className="w-full max-w-6xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-[var(--muted-foreground)] hover:underline"
        >
          ← Home
        </Link>

        <header className="mt-6">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Your plan
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2">
            {profile?.city ?? "Your new city"}
          </h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--foreground)]">
              {summary.headline}
            </span>{" "}
            · {summary.detail}
          </p>
        </header>

        {atDailyLimit ? (
          <DailyLimitBanner
            count={dailyUsage.count}
            limit={dailyUsage.limit}
          />
        ) : (
          aiFailed && <AiFailureBanner />
        )}

        {celebratingBadges.length > 0 && (
          <CelebrationBanner badges={celebratingBadges} />
        )}

        <BadgeShelf badges={badges} earnedIds={earnedBadgeIds} />

        <div className="mt-10">
          <PlanView
            tasks={tasks}
            todaysFocus={todaysFocus}
            currentDay={currentDay}
            preMoveSuggestions={preMoveSuggestions}
            weekOneOverlay={weekOneOverlay}
            month1Suggestions={month1Suggestions}
            month1TaskMap={month1TaskMap}
            goals={profile?.goals ?? []}
            city={profile?.city ?? null}
          />
        </div>
      </div>
    </main>
  );
}

function CelebrationBanner({ badges }: { badges: Badge[] }) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-[var(--accent)] bg-[var(--card)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            {badges.length === 1 ? "Badge earned" : "Badges earned"}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {badges.map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>
                  {b.icon ?? "🏅"}
                </span>
                <div>
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    {b.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <form action={dismissCelebrationAction}>
          <button
            type="submit"
            aria-label="Dismiss"
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xl leading-none"
          >
            ×
          </button>
        </form>
      </div>
    </div>
  );
}
