"use client";

import { useEffect, useState, useTransition } from "react";

import { addForYouToPlanAction } from "@/app/actions";
import type { ForYouItem } from "@/lib/for-you-data";

type Props = {
  item: ForYouItem;
  interest: string;
  addedToPlan: boolean;
};

// Compact one-line row for pre-move prep suggestions. Only action is
// "Add to plan" — saved-for-later is intentionally absent in MVP since
// there's no separate surface to view saved items anymore. After a click,
// a small confirmation strip appears under the row and auto-clears.
export function PreMoveRow({ item, interest, addedToPlan }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<"added" | null>(null);

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
      <div className="flex items-center gap-3 px-3 py-2">
        <span className="text-lg flex-shrink-0" aria-hidden>
          {item.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.title}</p>
          <p className="text-xs text-[var(--muted-foreground)] truncate">
            {item.shortDescription}
          </p>
        </div>
        <button
          type="button"
          aria-label={addedToPlan ? "Already in plan" : "Add to plan"}
          disabled={pending || addedToPlan}
          onClick={handleAdd}
          className={`text-xs h-7 px-2.5 rounded-full font-medium transition flex-shrink-0 ${
            addedToPlan
              ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-default"
              : "border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          }`}
        >
          {addedToPlan ? "✓ in plan" : "+ plan"}
        </button>
      </div>
      {feedback === "added" && (
        <div className="px-3 py-1.5 border-t border-[var(--border)] bg-[var(--background)] text-xs text-[var(--muted-foreground)] flex items-center gap-2">
          <span className="text-[var(--accent)]">✓</span>
          <span>Added to your plan — look in Week 1 below.</span>
        </div>
      )}
    </li>
  );
}
