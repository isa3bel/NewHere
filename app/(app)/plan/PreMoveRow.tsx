"use client";

import { useEffect, useState, useTransition } from "react";

import {
  addForYouToPlanAction,
  markForYouCompletedAction,
} from "@/app/actions";
import { uniqByUrl } from "@/lib/ai/sanitize";
import type { ForYouItem } from "@/lib/for-you-data";

type Props = {
  item: ForYouItem;
  interest: string;
  addedToPlan: boolean;
  completed: boolean;
};

// Click the row → expands inline to reveal the rich content the model
// generated (longDescription, all links, meta tags). Click again → collapse.
//
// Two side actions, both rendered as <span role="button"> because they
// live inside a parent <button> (the row expander). Browsers won't render
// nested actual <button>s.
//
//   + plan       → adds to Week 1 as pending
//   ✓ Mark done  → adds + immediately marks done in one click (for things
//                  the user has already taken care of pre-move)
//
// Once done, both buttons collapse into a single "Done" badge and the
// row dims — terminal state. Toggle back off from the task in Week 1.
export function PreMoveRow({ item, interest, addedToPlan, completed }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"added" | "done" | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  const handleAdd = () => {
    setFeedback("added");
    startTransition(() => addForYouToPlanAction({ item, interest }));
  };
  const handleMarkDone = () => {
    setFeedback("done");
    startTransition(() => markForYouCompletedAction({ item, interest }));
  };

  return (
    <li
      className={`rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden ${
        completed ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--background)] transition"
      >
        <span className="text-lg flex-shrink-0" aria-hidden>
          {item.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              completed ? "line-through" : ""
            }`}
          >
            {item.title}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] truncate">
            {item.shortDescription}
          </p>
        </div>
        <span
          className="text-xs text-[var(--muted-foreground)] flex-shrink-0"
          aria-hidden
        >
          {expanded ? "▴" : "▾"}
        </span>

        {completed ? (
          <span
            className="text-xs h-7 px-2.5 rounded-full font-medium bg-[var(--accent)] text-[var(--accent-foreground)] inline-flex items-center flex-shrink-0"
            aria-label="Already done"
          >
            ✓ Done
          </span>
        ) : (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <RowButton
              onActivate={handleAdd}
              disabled={pending || addedToPlan}
              variant={addedToPlan ? "muted" : "outline"}
              label={addedToPlan ? "Already in plan" : "Add to plan"}
            >
              {addedToPlan ? "✓ in plan" : "+ plan"}
            </RowButton>
            <RowButton
              onActivate={handleMarkDone}
              disabled={pending}
              variant="outline"
              label="Mark already done"
            >
              ✓ done
            </RowButton>
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-3 py-3 border-t border-[var(--border)] bg-[var(--background)]">
          <p className="text-sm leading-relaxed">{item.longDescription}</p>

          {(item.meta?.cost ||
            item.meta?.schedule ||
            item.meta?.location ||
            item.date) && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {item.date && <MetaChip label="When" value={item.date} />}
              {item.meta?.cost && (
                <MetaChip label="Cost" value={item.meta.cost} />
              )}
              {item.meta?.schedule && (
                <MetaChip label="Schedule" value={item.meta.schedule} />
              )}
              {item.meta?.location && (
                <MetaChip label="Where" value={item.meta.location} />
              )}
            </ul>
          )}

          {item.links.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {uniqByUrl(item.links).map((l) => (
                <li key={l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    {l.label} →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {feedback && (
        <div className="px-3 py-1.5 border-t border-[var(--border)] bg-[var(--background)] text-xs text-[var(--muted-foreground)] flex items-center gap-2">
          <span className="text-[var(--accent)]">✓</span>
          <span>
            {feedback === "added"
              ? "Added to your plan — look in Week 1 below."
              : "Marked done — check Week 1 for the entry."}
          </span>
        </div>
      )}
    </li>
  );
}

function RowButton({
  onActivate,
  disabled,
  variant,
  label,
  children,
}: {
  onActivate: () => void;
  disabled: boolean;
  variant: "outline" | "muted";
  label: string;
  children: React.ReactNode;
}) {
  const base =
    "text-xs h-7 px-2.5 rounded-full font-medium transition inline-flex items-center";
  const styles =
    variant === "muted"
      ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-default"
      : "border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer";
  const disabledStyles = disabled ? "opacity-60 cursor-not-allowed" : "";
  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        onActivate();
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onActivate();
        }
      }}
      className={`${base} ${styles} ${disabledStyles}`}
    >
      {children}
    </span>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <li className="inline-flex items-baseline gap-1 rounded-full bg-[var(--card)] border border-[var(--border)] px-2.5 py-0.5 text-xs">
      <span className="text-[var(--muted-foreground)]">{label}:</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}
