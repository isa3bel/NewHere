"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { toggleTaskAction } from "@/app/actions";
import type { ForYouItem } from "@/lib/for-you-data";
import { getTaskGuide } from "@/lib/task-guides";
import { phaseStatus } from "@/lib/plan-progress";
import type { PhaseStatus } from "@/lib/plan-progress";
import { PHASE_RANGES } from "@/lib/types";
import type { Phase, Task, TaskCategory } from "@/lib/types";

import { KeeperPrompt } from "./KeeperPrompt";
import { PreMoveRow } from "./PreMoveRow";

export type PreMoveTile = {
  item: ForYouItem;
  interest: string;
  addedToPlan: boolean;
};

const PHASE_ORDER: Phase[] = ["week_one", "month_one", "quarter_one"];

const CATEGORY_STYLES: Record<TaskCategory, string> = {
  essentials: "bg-slate-100 text-slate-800",
  community: "bg-blue-100 text-blue-800",
  hobby: "bg-purple-100 text-purple-800",
  routine: "bg-amber-100 text-amber-800",
  exploration: "bg-emerald-100 text-emerald-800",
};

const PHASE_STATUS_STYLES: Record<PhaseStatus, { label: string; className: string }> = {
  past: {
    label: "Past",
    className: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  },
  current: {
    label: "You are here",
    className: "bg-[var(--accent)] text-[var(--accent-foreground)]",
  },
  upcoming: {
    label: "Upcoming",
    className: "border border-[var(--border)] text-[var(--muted-foreground)]",
  },
};

type Props = {
  tasks: Task[];
  todaysFocus: Task[];
  currentDay: number;
  preMoveSuggestions: PreMoveTile[];
  city: string | null;
};

export function PlanView({
  tasks,
  todaysFocus,
  currentDay,
  preMoveSuggestions,
  city,
}: Props) {
  const isPreMove = currentDay < 0;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (selectedId && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  const phaseBuckets: Record<Phase, Task[]> = useMemo(() => {
    const buckets: Record<Phase, Task[]> = {
      week_one: [],
      month_one: [],
      quarter_one: [],
    };
    for (const task of tasks) buckets[task.phase].push(task);
    return buckets;
  }, [tasks]);

  const selectedTask = selectedId
    ? tasks.find((t) => t.id === selectedId) ?? null
    : null;

  const focusIds = useMemo(
    () => new Set(todaysFocus.map((t) => t.id)),
    [todaysFocus],
  );

  return (
    <div className="lg:flex lg:gap-6">
      <div
        className={`${
          selectedTask
            ? "hidden lg:block lg:w-[28rem] lg:flex-shrink-0"
            : "w-full"
        }`}
      >
        {isPreMove ? (
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-xl font-semibold">Prepare for your move</h2>
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest">
                Pre-move
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              You&apos;re not in {city || "your new city"} yet — these are
              communities, groups, and resources you can join or read up on
              now. The day-by-day checklist starts the day you arrive.
            </p>
            {preMoveSuggestions.length > 0 ? (
              <ul className="space-y-2">
                {preMoveSuggestions.map((p) => (
                  <PreMoveRow
                    key={p.item.id}
                    item={p.item}
                    interest={p.interest}
                    addedToPlan={p.addedToPlan}
                  />
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
                Add interests in your profile and we&apos;ll surface communities
                and resources here you can join or read before you arrive.
              </div>
            )}
          </section>
        ) : (
          todaysFocus.length > 0 && (
            <section className="mb-12">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-xl font-semibold">Today&apos;s focus</h2>
                <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest">
                  {todaysFocus.length === 1
                    ? "1 task"
                    : `${todaysFocus.length} tasks`}
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                The next steps that matter most right now.
              </p>
              <ul className="space-y-3">
                {todaysFocus.map((task) => (
                  <TaskRow
                    key={`focus-${task.id}`}
                    task={task}
                    isSelected={task.id === selectedId}
                    onSelect={() => setSelectedId(task.id)}
                    emphasis
                  />
                ))}
              </ul>
            </section>
          )
        )}

        {isPreMove && (
          <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            The day-by-day plan below kicks in once you&apos;re in{" "}
            {city || "your new city"}. You can browse it now to see what&apos;s
            coming.
          </div>
        )}

        <div className="space-y-12">
          {PHASE_ORDER.map((phase) => {
            const phaseTasks = phaseBuckets[phase];
            if (phaseTasks.length === 0) return null;
            const phaseDone = phaseTasks.filter((t) => t.status === "done").length;
            const range = PHASE_RANGES[phase];
            const status = phaseStatus(phase, currentDay);
            const statusStyle = PHASE_STATUS_STYLES[status];
            return (
              <section key={phase}>
                <div className="flex items-baseline justify-between mb-1 gap-3 flex-wrap">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h2 className="text-xl font-semibold">{range.stage}</h2>
                    <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest">
                      {range.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle.className}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {phaseDone} / {phaseTasks.length} done
                  </span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  {range.stageBlurb} · Days {range.start + 1}–{range.end + 1}
                </p>
                <ul className="space-y-3">
                  {phaseTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isSelected={task.id === selectedId}
                      onSelect={() => setSelectedId(task.id)}
                      muted={status === "past" && task.status !== "done"}
                      focus={focusIds.has(task.id)}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      {selectedTask && (
        <div className="lg:flex-1 lg:min-w-0">
          <TaskDetailPanel
            ref={panelRef}
            task={selectedTask}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  isSelected,
  onSelect,
  emphasis,
  muted,
  focus,
}: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  emphasis?: boolean;
  muted?: boolean;
  focus?: boolean;
}) {
  const done = task.status === "done";
  const nextStatus = done ? "pending" : "done";

  const baseRing = isSelected
    ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
    : emphasis
      ? "border-[var(--accent)]"
      : done
        ? "border-[var(--border)] bg-[var(--muted)]"
        : "border-[var(--border)] bg-[var(--card)]";

  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border p-4 transition cursor-pointer hover:border-[var(--accent)] ${baseRing} ${muted ? "opacity-60" : ""}`}
      onClick={onSelect}
    >
      <form action={toggleTaskAction} onClick={(e) => e.stopPropagation()}>
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
      <div className="flex-1 min-w-0">
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
          {focus && !emphasis && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
              Today
            </span>
          )}
        </div>
        {task.description && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {task.description}
          </p>
        )}
        {done && (task.isRecurringActivity || task.isEventAttendance) && (
          <KeeperPrompt taskId={task.id} state={task.keeperState} />
        )}
      </div>
    </li>
  );
}

function TaskDetailPanel({
  task,
  onClose,
  ref,
}: {
  task: Task;
  onClose: () => void;
  ref?: React.Ref<HTMLElement>;
}) {
  const guide = getTaskGuide(task);
  const done = task.status === "done";

  return (
    <aside
      ref={ref}
      className="rounded-2xl border-2 border-[var(--accent)] bg-[var(--card)] p-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full capitalize ${CATEGORY_STYLES[task.category]}`}
            >
              {task.category}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              Day {task.dayOffset + 1}
            </span>
          </div>
          <h2
            className={`text-xl font-semibold leading-tight ${done ? "line-through text-[var(--muted-foreground)]" : ""}`}
          >
            {task.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-2xl leading-none -mt-1"
        >
          ×
        </button>
      </div>

      {task.description && (
        <p className="text-[var(--muted-foreground)] mb-6">{task.description}</p>
      )}

      <ol className="space-y-4">
        {guide.steps.map((step, idx) => (
          <li
            key={idx}
            className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-semibold">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{step.title}</h3>
                {step.body && (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {step.body}
                  </p>
                )}
                {step.link && (
                  <a
                    href={step.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
                  >
                    {step.link.label} →
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {guide.resources && guide.resources.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
            Resources
          </h3>
          <ul className="space-y-2">
            {guide.resources.map((r) => (
              <li key={r.url}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  {r.label} →
                </a>
                {r.description && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {r.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

    </aside>
  );
}
