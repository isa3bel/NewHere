import Link from "next/link";

import { dismissCelebrationAction } from "@/app/actions";

// Vercel default function timeout is 10s on Hobby, 15s on Pro. Real
// Claude calls with web_search routinely take 15–30s, so we bump it.
// 60s is the Hobby ceiling; Pro can go higher. Per Next.js docs this
// also covers Server Actions invoked from this page (e.g. the
// "Refresh suggestions" button → refreshAiSuggestionsAction).
export const maxDuration = 60;
import { PlanView } from "./PlanView";
import type { PreMoveTile } from "./PlanView";
import { getOrGeneratePreMoveSuggestions } from "@/lib/ai/generate-pre-move";
import { getOrGenerateWeekOneOverlay } from "@/lib/ai/generate-week-one";
import { toForYouItem } from "@/lib/ai/types";
import type { AiWeekOneDetail } from "@/lib/ai/types";
import { requireUser } from "@/lib/auth";
import { readCelebrationBadgeIds } from "@/lib/celebration";
import {
  getActivePlan,
  getBadges,
  getProfile,
  getTasksForPlan,
} from "@/lib/db";
import {
  daysSinceMove,
  getTodaysFocus,
  moveSummary,
} from "@/lib/plan-progress";
import type { Badge } from "@/lib/types";

export default async function PlanPage() {
  const user = await requireUser();
  const [profile, plan, badges] = await Promise.all([
    getProfile(user.id),
    getActivePlan(user.id),
    getBadges(),
  ]);

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
  const inPlanItemIds = new Set<string>();
  for (const t of tasks) {
    if (!t.sourceItemId) continue;
    inPlanItemIds.add(t.sourceItemId);
    if (t.keeperState === "not_for_me") notForMeItemIds.add(t.sourceItemId);
  }

  // Pre-move suggestions come from the AI cache layer. First call per
  // (user, profile-fingerprint) generates (mock for now) and stores;
  // subsequent loads are pure DB reads. Same shape as before so PlanView
  // doesn't care that the source changed.
  const aiSuggestions = profile && currentDay < 0
    ? await getOrGeneratePreMoveSuggestions(user.id, profile)
    : [];

  const preMoveSuggestions: PreMoveTile[] = aiSuggestions
    .filter((s) => !notForMeItemIds.has(s.id))
    .map((s) => ({
      item: toForYouItem(s),
      interest: s.matchedInterest,
      addedToPlan: inPlanItemIds.has(s.id),
    }));

  // Week 1 city-specific overlay. Cached per profile fingerprint;
  // first load triggers a generation, subsequent loads are free reads.
  // Empty array if profile is missing or AI failed — UI falls back to
  // static guides.
  const weekOneOverlay: AiWeekOneDetail[] = profile
    ? await getOrGenerateWeekOneOverlay(user.id, profile)
    : [];

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

        {celebratingBadges.length > 0 && (
          <CelebrationBanner badges={celebratingBadges} />
        )}

        <div className="mt-10">
          <PlanView
            tasks={tasks}
            todaysFocus={todaysFocus}
            currentDay={currentDay}
            preMoveSuggestions={preMoveSuggestions}
            weekOneOverlay={weekOneOverlay}
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
