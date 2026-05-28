"use client";

import { useTransition } from "react";

import { refreshAiSuggestionsAction } from "@/app/actions";

type Props = {
  surface: "pre_move" | "month_1";
};

// Small "Refresh" affordance next to the section header. Clicking
// invalidates the AI cache for that surface; the next render fetches
// fresh content (and counts against the per-user daily limit).
export function RefreshSuggestionsButton({ surface }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => refreshAiSuggestionsAction({ surface }))
      }
      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] hover:underline disabled:opacity-50"
      aria-label="Refresh suggestions"
    >
      {pending ? "Refreshing…" : "↻ Refresh"}
    </button>
  );
}
