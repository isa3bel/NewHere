"use client";

import { useTransition } from "react";

import { setKeeperStateAction } from "@/app/actions";

type Props = {
  taskId: string;
  title: string;
};

// Pill chip for an anchor in the "Every week" section. The × button
// demotes the anchor back to "none" — the task itself stays in the plan
// (still marked done), it just leaves the routine surface and gets
// re-prompted next time the task is completed.
export function AnchorPill({ taskId, title }: Props) {
  const [pending, startTransition] = useTransition();

  const remove = () =>
    startTransition(() =>
      setKeeperStateAction({ taskId, state: "none" }),
    );

  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)] bg-[var(--background)] px-2.5 py-1 text-xs">
      <span aria-hidden>📌</span>
      <span>{title}</span>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label={`Remove ${title} from your routine`}
        className="ml-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] leading-none"
      >
        ×
      </button>
    </li>
  );
}
