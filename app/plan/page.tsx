import Link from "next/link";

import { dismissCelebrationAction, toggleTaskAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { readCelebrationBadgeIds } from "@/lib/celebration";
import {
  getActivePlan,
  getBadges,
  getProfile,
  getTasksForPlan,
  getUserBadges,
} from "@/lib/db";
import type { Badge, Task, TaskCategory } from "@/lib/types";

const CATEGORY_STYLES: Record<TaskCategory, string> = {
  community: "bg-blue-100 text-blue-800",
  hobby: "bg-purple-100 text-purple-800",
  routine: "bg-amber-100 text-amber-800",
  exploration: "bg-emerald-100 text-emerald-800",
};

export default async function PlanPage() {
  const user = await requireUser();
  const [profile, plan, badges, userBadges] = await Promise.all([
    getProfile(user.id),
    getActivePlan(user.id),
    getBadges(),
    getUserBadges(user.id),
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
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const celebrationIds = await readCelebrationBadgeIds();
  const celebratingBadges = badges.filter((b) => celebrationIds.includes(b.id));

  const weekBuckets: Task[][] = [[], [], [], []];
  for (const task of tasks) {
    const weekIndex = Math.min(3, Math.floor(task.dayOffset / 7));
    weekBuckets[weekIndex].push(task);
  }

  return (
    <main className="flex flex-col flex-1 items-center">
      <div className="w-full max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-[var(--muted-foreground)] hover:underline"
        >
          ← Home
        </Link>

        <header className="mt-6">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Your 30-day plan
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2">
            {profile?.city ?? "Your new city"}
          </h1>
          {profile?.moveDate && (
            <p className="mt-1 text-[var(--muted-foreground)]">
              Moving on {new Date(profile.moveDate).toLocaleDateString()}
            </p>
          )}
        </header>

        {celebratingBadges.length > 0 && (
          <CelebrationBanner badges={celebratingBadges} />
        )}

        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-[var(--muted-foreground)]">
              {completedCount} of {totalCount} done
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--muted)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                    earned
                      ? "border-[var(--accent)] bg-[var(--card)]"
                      : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] opacity-60"
                  }`}
                  title={badge.description}
                >
                  <span>{badge.icon ?? "•"}</span>
                  <span>{badge.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 space-y-10">
          {weekBuckets.map((weekTasks, idx) =>
            weekTasks.length === 0 ? null : (
              <div key={idx}>
                <h2 className="text-lg font-semibold mb-4">Week {idx + 1}</h2>
                <ul className="space-y-3">
                  {weekTasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </ul>
              </div>
            ),
          )}
        </section>
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

function TaskRow({ task }: { task: Task }) {
  const done = task.status === "done";
  const nextStatus = done ? "pending" : "done";

  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
        done
          ? "border-[var(--border)] bg-[var(--muted)]"
          : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      <form action={toggleTaskAction}>
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="nextStatus" value={nextStatus} />
        <button
          type="submit"
          aria-label={done ? "Mark as not done" : "Mark as done"}
          className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
            done
              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "border-[var(--border)] hover:border-[var(--accent)]"
          }`}
        >
          {done && (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.085l6.79-6.795a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </form>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className={`font-medium ${done ? "line-through text-[var(--muted-foreground)]" : ""}`}
          >
            {task.title}
          </h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full capitalize ${CATEGORY_STYLES[task.category]}`}
          >
            {task.category}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            Day {task.dayOffset + 1}
          </span>
        </div>
        {task.description && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {task.description}
          </p>
        )}
        {task.linkUrl && (
          <a
            href={task.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
          >
            Open link →
          </a>
        )}
      </div>
    </li>
  );
}
