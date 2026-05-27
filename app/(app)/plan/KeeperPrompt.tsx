"use client";

import { useTransition } from "react";

import { setKeeperStateAction } from "@/app/actions";
import type { KeeperState } from "@/lib/types";

type Props = {
  taskId: string;
  state: KeeperState;
};

const CHIP_STYLES: Record<Exclude<KeeperState, "none">, string> = {
  keep: "bg-[var(--accent)] text-[var(--accent-foreground)]",
  maybe: "bg-amber-100 text-amber-800",
  not_for_me: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};

const CHIP_LABELS: Record<Exclude<KeeperState, "none">, string> = {
  keep: "📌 In your routine",
  maybe: "↪ Maybe later",
  not_for_me: "✕ Not for me",
};

// Inline "Did this stick?" prompt shown beneath completed recurring/event
// tasks. Surfaces three choices that map to KeeperState.
// Once chosen, collapses to a small chip with a "change" affordance.
export function KeeperPrompt({ taskId, state }: Props) {
  const [pending, startTransition] = useTransition();

  const pick = (next: KeeperState) =>
    startTransition(() => setKeeperStateAction({ taskId, state: next }));

  if (state === "none") {
    return (
      <div className="mt-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--muted-foreground)] mr-1">
          Did this stick?
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            pick("keep");
          }}
          className="text-xs px-3 py-1 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] font-medium hover:opacity-90 transition"
        >
          Keep it
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            pick("maybe");
          }}
          className="text-xs px-3 py-1 rounded-full border border-[var(--border)] hover:border-amber-500 font-medium transition"
        >
          Maybe
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            pick("not_for_me");
          }}
          className="text-xs px-3 py-1 rounded-full border border-[var(--border)] hover:border-[var(--muted-foreground)] text-[var(--muted-foreground)] font-medium transition"
        >
          Not for me
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHIP_STYLES[state]}`}
      >
        {CHIP_LABELS[state]}
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.stopPropagation();
          pick("none");
        }}
        className="text-xs text-[var(--muted-foreground)] hover:underline"
      >
        change
      </button>
    </div>
  );
}
