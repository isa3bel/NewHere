"use client";

import { useEffect, useState, useTransition } from "react";

import { addForYouToPlanAction } from "@/app/actions";
import type { ForYouItem } from "@/lib/for-you-data";

type Props = {
  item: ForYouItem;
  interest: string;
  addedToPlan: boolean;
};

// Click the row → expands inline to reveal the rich content the model
// generated (longDescription, all links, meta tags). Click again → collapse.
// The "+ plan" button is rendered with stopPropagation so clicking it
// doesn't trigger the expand toggle.
//
// Once added to plan, the same content gets persisted to tasks.details_json
// so the right-panel detail view in Week 1 shows the same info — no
// generic placeholders.
export function PreMoveRow({ item, interest, addedToPlan }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"added" | null>(null);
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

  return (
    <li className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
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
          <p className="text-sm font-medium truncate">{item.title}</p>
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
        <span
          role="button"
          tabIndex={0}
          aria-label={addedToPlan ? "Already in plan" : "Add to plan"}
          aria-disabled={pending || addedToPlan}
          onClick={(e) => {
            e.stopPropagation();
            if (pending || addedToPlan) return;
            handleAdd();
          }}
          onKeyDown={(e) => {
            if (pending || addedToPlan) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              handleAdd();
            }
          }}
          className={`text-xs h-7 px-2.5 rounded-full font-medium transition flex-shrink-0 inline-flex items-center cursor-pointer ${
            addedToPlan
              ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-default"
              : "border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          } ${pending ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {addedToPlan ? "✓ in plan" : "+ plan"}
        </span>
      </button>

      {expanded && (
        <div className="px-3 py-3 border-t border-[var(--border)] bg-[var(--background)]">
          <p className="text-sm leading-relaxed">{item.longDescription}</p>

          {(item.meta?.cost || item.meta?.schedule || item.meta?.location ||
            item.date) && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {item.date && <MetaChip label="When" value={item.date} />}
              {item.meta?.cost && <MetaChip label="Cost" value={item.meta.cost} />}
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
              {item.links.map((l) => (
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

      {feedback === "added" && (
        <div className="px-3 py-1.5 border-t border-[var(--border)] bg-[var(--background)] text-xs text-[var(--muted-foreground)] flex items-center gap-2">
          <span className="text-[var(--accent)]">✓</span>
          <span>Added to your plan — look in Week 1 below.</span>
        </div>
      )}
    </li>
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
