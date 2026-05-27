"use client";

import { useEffect, useState } from "react";

// Loading state for AI-powered search. Drop this into a React <Suspense>
// fallback once the Claude + web_search backend is wired up. The stage
// messages rotate on a timer to communicate progress during the ~10–30s wait.
//
//   <Suspense fallback={<SearchProgress query={query} city={city} />}>
//     <SearchResults query={query} city={city} />
//   </Suspense>

const STAGES = [
  "Searching the web…",
  "Reading event listings on Luma and Eventbrite…",
  "Finding local organizations and studios…",
  "Looking for Reddit threads and Facebook groups…",
  "Checking city event calendars…",
  "Organizing results for you…",
];

const STAGE_MS = 2800;

export function SearchProgress({
  query,
  city,
}: {
  query: string;
  city?: string;
}) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStageIndex((s) => Math.min(s + 1, STAGES.length - 1));
    }, STAGE_MS);
    return () => clearInterval(id);
  }, []);

  const stage = STAGES[stageIndex];
  const progress = ((stageIndex + 1) / STAGES.length) * 100;

  return (
    <section className="mt-10" aria-busy="true" aria-live="polite">
      <div className="rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--card)] p-8">
        <div className="flex items-center gap-4">
          <Spinner />
          <div className="flex-1 min-w-0">
            <p className="font-medium">{stage}</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Looking up &ldquo;{query}&rdquo;
              {city && ` in ${city}`} — this usually takes 10–30 seconds.
            </p>
          </div>
        </div>

        <div className="mt-5 h-1.5 w-full rounded-full bg-[var(--muted)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <TileSkeleton key={i} delayMs={i * 90} />
        ))}
      </div>
    </section>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-6 w-6 flex-shrink-0 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin"
      aria-hidden
    />
  );
}

function TileSkeleton({ delayMs }: { delayMs: number }) {
  // Staggered fade-in via CSS variable + animation-delay, so all tiles
  // don't pulse in unison — feels less robotic.
  const style = { animationDelay: `${delayMs}ms` } as React.CSSProperties;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start gap-3">
        <div
          className="h-8 w-8 rounded-full bg-[var(--muted)] animate-pulse"
          style={style}
        />
        <div className="flex-1 space-y-2">
          <div
            className="h-4 w-3/4 rounded bg-[var(--muted)] animate-pulse"
            style={style}
          />
          <div
            className="h-3 w-1/3 rounded bg-[var(--muted)] animate-pulse"
            style={style}
          />
          <div
            className="h-3 w-2/3 rounded bg-[var(--muted)] animate-pulse mt-3"
            style={style}
          />
          <div
            className="h-3 w-1/2 rounded bg-[var(--muted)] animate-pulse"
            style={style}
          />
        </div>
      </div>
    </div>
  );
}
