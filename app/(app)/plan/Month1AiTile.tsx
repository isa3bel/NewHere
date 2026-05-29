"use client";

import { useEffect, useState, useTransition } from "react";

import { markForYouCompletedAction } from "@/app/actions";
import { uniqByUrl } from "@/lib/ai/sanitize";
import type { AiMonth1Tile } from "@/lib/ai/types";
import { month1TileToForYouItem } from "@/lib/ai/types";
import type { KeeperState } from "@/lib/types";

import { KeeperPrompt } from "./KeeperPrompt";

type Props = {
  tile: AiMonth1Tile;
  completed: boolean;
  // Backing task info, populated once the user marks the tile done
  // (markForYouCompletedAction creates the task). null before then.
  taskId: string | null;
  keeperState: KeeperState | null;
};

// One Month 1 tile rendered from an AI-generated org/community suggestion.
// Click to expand → reveals longDescription + logistics + links.
// Single action: "✓ done" — creates the task and marks it complete in
// one click. After completion, the keep/maybe/not-for-me prompt shows
// inline so the user can flag whether this stuck.
// Image-first: when the AI provides imageUrl, show it as a square
// thumbnail. On error, fall back to the emoji icon. Lazy-loaded so
// off-screen tiles don't block initial paint on cold cache hits.
export function Month1AiTile({
  tile,
  completed,
  taskId,
  keeperState,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [feedback, setFeedback] = useState<"done" | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  // Cache miss: try image. Cache hit + fail: fall back to emoji.
  const showImage = tile.imageUrl && !imgFailed;

  const interest = tile.matchedInterest ?? tile.cluster;
  const forYouItem = month1TileToForYouItem(tile);

  const handleDone = () => {
    setFeedback("done");
    startTransition(() =>
      markForYouCompletedAction({
        item: forYouItem,
        interest,
        phase: "month_one",
      }),
    );
  };

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-[var(--background)] transition"
      >
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--muted)] overflow-hidden"
          aria-hidden
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tile.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              width={56}
              height={56}
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl">{tile.icon}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight">
              {tile.title}
            </h4>
            <span
              className="text-xs text-[var(--muted-foreground)] flex-shrink-0"
              aria-hidden
            >
              {expanded ? "▴" : "▾"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] leading-snug">
            {tile.shortDescription}
          </p>
          {tile.meta?.schedule && !expanded && (
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
              {tile.meta.schedule}
              {tile.meta.cost ? ` · ${tile.meta.cost}` : ""}
            </p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 -mt-1 border-t border-[var(--border)] bg-[var(--background)]/50">
          <p className="mt-3 text-sm leading-relaxed">{tile.longDescription}</p>

          {(tile.meta?.cost ||
            tile.meta?.schedule ||
            tile.meta?.location ||
            tile.meta?.howToJoin) && (
            <ul className="mt-3 space-y-1.5 text-xs text-[var(--muted-foreground)]">
              {tile.meta?.cost && (
                <MetaLine label="Cost" value={tile.meta.cost} />
              )}
              {tile.meta?.schedule && (
                <MetaLine label="When" value={tile.meta.schedule} />
              )}
              {tile.meta?.location && (
                <MetaLine label="Where" value={tile.meta.location} />
              )}
              {tile.meta?.howToJoin && (
                <MetaLine label="How to join" value={tile.meta.howToJoin} />
              )}
            </ul>
          )}

          {tile.links.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {uniqByUrl(tile.links).map((l) => (
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

      {!completed && (
        <div className="px-4 py-3 border-t border-[var(--border)] flex items-center gap-2">
          <button
            type="button"
            onClick={handleDone}
            disabled={pending}
            className="text-xs h-7 px-2.5 rounded-full border border-[var(--border)] font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition disabled:opacity-60"
          >
            ✓ done
          </button>
        </div>
      )}

      {completed && (
        <div className="px-4 py-3 border-t border-[var(--border)] space-y-2">
          <span className="text-xs px-2.5 h-7 inline-flex items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] font-medium">
            ✓ Done
          </span>
          {taskId && (
            <KeeperPrompt taskId={taskId} state={keeperState ?? "none"} />
          )}
        </div>
      )}

      {feedback && (
        <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--background)] text-xs text-[var(--muted-foreground)]">
          Marked done — entry recorded.
        </div>
      )}
    </article>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <li>
      <span className="font-semibold text-[var(--foreground)] mr-1">
        {label}:
      </span>
      <span>{value}</span>
    </li>
  );
}
