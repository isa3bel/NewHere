"use client";

import { useTransition } from "react";

import { refreshAiSuggestionsAction } from "@/app/actions";

type Props = {
  surface: "pre_move" | "month_1";
};

// Small "Refresh" affordance next to the section header. Clicking
// invalidates the AI cache for that surface; the next render fetches
// fresh content (and counts against the per-user daily limit).
//
// While the server action + revalidate are running, useTransition
// keeps `pending` true so we render a prominent loading state in
// place of the button — a small "↻ Refresh" link can be hard to
// notice as "still working" during the 15–30s AI call.
export function RefreshSuggestionsButton({ surface }: Props) {
  const [pending, startTransition] = useTransition();

  if (pending) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]"
      >
        <Spinner />
        <span>Refreshing… (up to 30s)</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => refreshAiSuggestionsAction({ surface }))
      }
      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent)] hover:underline"
      aria-label="Refresh suggestions"
    >
      ↻ Refresh
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin"
    />
  );
}
