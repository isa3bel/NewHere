import { daysSinceMove } from "@/lib/plan-progress";
import type { Task } from "@/lib/types";

import { AnchorPill } from "./AnchorPill";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeekMonday(d: Date): Date {
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() + diff);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type Props = {
  tasks: Task[];
  anchors: Task[];
  moveDate: string;
  currentDay: number;
};

// 7-day grid (Mon–Sun). Always renders.
//   - Post-move (currentDay >= 0): shows the current calendar week.
//   - Pre-move: pivots to the week containing the move date, so the user
//     can see their first week's structure before they arrive.
//   - Weekend columns visually differentiated; today highlighted; move-day
//     highlighted pre-move as a separate marker.
//   - Anchors appear as an "Every week" footer (no day-of-week metadata yet).
export function YourWeek({ tasks, anchors, moveDate, currentDay }: Props) {
  const today = new Date();
  const moveDateObj = moveDate ? new Date(moveDate) : null;
  const isPreMove = currentDay < 0;

  const anchorDate = isPreMove && moveDateObj ? moveDateObj : today;
  const monday = startOfWeekMonday(anchorDate);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const dayOffset = moveDate ? daysSinceMove(moveDate, date) : -1;
    const dayTasks = moveDate
      ? tasks.filter((t) => t.dayOffset === dayOffset)
      : [];
    return {
      date,
      label: WEEKDAY_LABELS[i],
      dayOffset,
      dayTasks,
      isToday: sameDay(date, today),
      isMoveDay: moveDateObj ? sameDay(date, moveDateObj) : false,
      isWeekend: i >= 5,
    };
  });

  const headerSuffix = isPreMove ? "Your move week" : "This week";

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Your week</h2>
        <span className="text-xs text-[var(--muted-foreground)]">
          {headerSuffix} · {monthRange(days[0].date, days[6].date)}
        </span>
      </div>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        {isPreMove
          ? "Here's what your first week in the new city looks like."
          : "What this week looks like — what's scheduled, plus the things you've made part of your routine."}
      </p>

      <div className="-mx-2 overflow-x-auto pb-2">
        <div className="px-2 grid grid-cols-7 gap-2 min-w-[42rem]">
          {days.map((day) => (
            <DayColumn key={day.date.toISOString()} {...day} />
          ))}
        </div>
      </div>

      {anchors.length > 0 && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
            Every week
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {anchors.map((anchor) => (
              <AnchorPill
                key={anchor.id}
                taskId={anchor.id}
                title={anchor.title}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function DayColumn({
  label,
  date,
  dayTasks,
  isToday,
  isMoveDay,
  isWeekend,
}: {
  label: string;
  date: Date;
  dayTasks: Task[];
  isToday: boolean;
  isMoveDay: boolean;
  isWeekend: boolean;
}) {
  const highlight = isToday || isMoveDay;
  const bg = highlight
    ? "bg-[var(--accent)]/10 border-[var(--accent)]"
    : isWeekend
      ? "bg-[var(--muted)] border-[var(--border)]"
      : "bg-[var(--card)] border-[var(--border)]";

  return (
    <div className={`rounded-xl border ${bg} p-2 min-h-[8rem] flex flex-col`}>
      <div className="flex items-baseline justify-between mb-2">
        <span
          className={`text-xs font-semibold uppercase tracking-widest ${
            highlight
              ? "text-[var(--accent)]"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          {label}
        </span>
        <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
          {date.getDate()}
        </span>
      </div>
      {isMoveDay && !isToday && (
        <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--accent)] mb-1">
          Move day
        </span>
      )}
      {dayTasks.length === 0 ? (
        <p className="text-[10px] text-[var(--muted-foreground)] italic">—</p>
      ) : (
        <ul className="space-y-1">
          {dayTasks.map((task) => (
            <li
              key={task.id}
              className={`rounded-md bg-[var(--background)] border border-[var(--border)] px-2 py-1 text-xs leading-tight ${
                task.status === "done"
                  ? "line-through text-[var(--muted-foreground)]"
                  : ""
              }`}
              title={task.title}
            >
              <span className="line-clamp-2">{task.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function monthRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, opts)} – ${end.getDate()}`;
  }
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}
