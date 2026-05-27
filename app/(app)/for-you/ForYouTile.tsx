"use client";

import { useState } from "react";

import { getTypeLabel, type ForYouItem } from "@/lib/for-you-data";
import type { SavedItemState } from "@/lib/types";

import { ItemActions } from "./ItemActions";

type Props = {
  item: ForYouItem;
  interest: string;
  savedState: SavedItemState | null;
  addedToPlan: boolean;
  // When true, the tile is rendered inside the shortlist; we de-emphasize
  // the "Save" affordance and lean into state transitions and add-to-plan.
  compact?: boolean;
};

export function ForYouTile({ item, interest, savedState, addedToPlan, compact }: Props) {
  const [expanded, setExpanded] = useState(false);
  const saved = savedState !== null;

  return (
    <div
      className={`rounded-2xl border bg-[var(--card)] transition ${
        expanded
          ? "border-[var(--accent)] ring-1 ring-[var(--accent)]"
          : saved
            ? "border-[var(--accent)]"
            : "border-[var(--border)]"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={`w-full text-left ${compact ? "p-4" : "p-5"} cursor-pointer`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0" aria-hidden>
            {item.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold">{item.title}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                {getTypeLabel(item.type)}
              </span>
              {!compact && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted-foreground)]"
                  title={`Suggested because you picked "${interest}"`}
                >
                  {interest}
                </span>
              )}
            </div>
            {item.date && (
              <p className="text-sm font-medium text-[var(--accent)] mb-1">
                📅 {item.date}
              </p>
            )}
            <p className="text-sm text-[var(--muted-foreground)]">
              {item.shortDescription}
            </p>
            {item.meta && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                {item.meta.cost && <span>💰 {item.meta.cost}</span>}
                {item.meta.schedule && <span>📅 {item.meta.schedule}</span>}
                {item.meta.location && <span>📍 {item.meta.location}</span>}
              </div>
            )}
          </div>
          <span
            className={`text-[var(--muted-foreground)] transition ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </div>
      </button>

      <div className={`${compact ? "px-4 pb-4" : "px-5 pb-5"}`}>
        <ItemActions
          item={item}
          interest={interest}
          savedState={savedState}
          addedToPlan={addedToPlan}
        />
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] px-5 py-4">
          <p className="text-sm leading-relaxed">{item.longDescription}</p>
          {item.links.length > 0 && (
            <div className="mt-4 space-y-1">
              {item.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[var(--accent)] hover:underline"
                >
                  {link.label} →
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
