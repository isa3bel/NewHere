"use client";

import { useTransition } from "react";

import {
  addForYouToPlanAction,
  setSavedStateAction,
  toggleSaveForYouAction,
} from "@/app/actions";
import type { ForYouItem } from "@/lib/for-you-data";
import type { SavedItemState } from "@/lib/types";

type Props = {
  item: ForYouItem;
  interest: string;
  savedState: SavedItemState | null;
  addedToPlan: boolean;
};

const isEventLike = (item: ForYouItem) =>
  item.type === "event" || item.type === "class";

export function ItemActions({ item, interest, savedState, addedToPlan }: Props) {
  const [pending, startTransition] = useTransition();
  const saved = savedState !== null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() =>
            toggleSaveForYouAction({
              item,
              interest,
              currentlySaved: saved,
            }),
          )
        }
        className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
          saved
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : "border border-[var(--border)] hover:border-[var(--accent)]"
        } ${pending ? "opacity-60" : ""}`}
      >
        {saved ? "★ Saved" : "☆ Save"}
      </button>

      {saved && isEventLike(item) && savedState !== "went" && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() =>
              setSavedStateAction({
                forYouItemId: item.id,
                state: savedState === "going" ? "shortlist" : "going",
              }),
            )
          }
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
            savedState === "going"
              ? "bg-blue-100 text-blue-800"
              : "border border-[var(--border)] hover:border-blue-500"
          }`}
        >
          {savedState === "going" ? "✓ Going" : "I'm going"}
        </button>
      )}

      {saved && isEventLike(item) && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(() =>
              setSavedStateAction({
                forYouItemId: item.id,
                state: savedState === "went" ? "shortlist" : "went",
              }),
            )
          }
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
            savedState === "went"
              ? "bg-emerald-100 text-emerald-800"
              : "border border-[var(--border)] hover:border-emerald-500"
          }`}
        >
          {savedState === "went" ? "✓ Went" : "I went"}
        </button>
      )}

      <button
        type="button"
        disabled={pending || addedToPlan}
        onClick={() =>
          startTransition(() =>
            addForYouToPlanAction({ item, interest }),
          )
        }
        className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
          addedToPlan
            ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-default"
            : "border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        }`}
      >
        {addedToPlan ? "✓ In your plan" : "+ Add to my plan"}
      </button>
    </div>
  );
}
