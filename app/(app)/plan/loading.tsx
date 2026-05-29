// Shown automatically by Next.js while page.tsx is rendering server-side.
// On a cache-miss the AI generation can take 15–30s, so an explicit
// "this is normal, hang on" surface is much friendlier than a blank
// white tab. On cache hits this flashes briefly (<1s) and is replaced
// by the real page.

export default function PlanLoading() {
  return (
    <main className="flex flex-col flex-1 items-center">
      <div className="w-full max-w-6xl px-6 py-12">
        <span className="text-sm text-[var(--muted-foreground)]">← Home</span>

        <header className="mt-6">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Your plan
          </p>
          <div className="mt-2 h-10 w-64 rounded-lg bg-[var(--muted)] animate-pulse" />
          <div className="mt-3 h-4 w-80 rounded bg-[var(--muted)] animate-pulse" />
        </header>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <div className="mx-auto h-10 w-10">
            <div
              className="h-10 w-10 rounded-full border-4 border-[var(--muted)] border-t-[var(--accent)] animate-spin"
              aria-hidden
            />
          </div>
          <h2 className="mt-5 text-lg font-semibold">
            Personalizing your plan…
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
            We&apos;re researching your city to find the right transit card,
            utilities, library system, and more. This can take up to{" "}
            <strong className="text-[var(--foreground)]">30 seconds</strong> on
            the first load — every visit after this is instant.
          </p>
          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            On a slow connection?{" "}
            <a
              href="/plan"
              className="font-medium text-[var(--accent)] underline hover:no-underline"
            >
              Tap here to retry
            </a>{" "}
            — your plan finishes in the background, so the next try loads
            instantly.
          </p>
        </section>

        <div className="mt-10 space-y-8">
          <SkeletonSection lines={3} />
          <SkeletonSection lines={4} />
        </div>
      </div>
    </main>
  );
}

function SkeletonSection({ lines }: { lines: number }) {
  return (
    <section>
      <div className="h-6 w-40 rounded bg-[var(--muted)] animate-pulse" />
      <ul className="mt-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <li
            key={i}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-start gap-3"
          >
            <div className="h-6 w-6 rounded-full bg-[var(--muted)] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 w-3/4 rounded bg-[var(--muted)] animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-[var(--muted)] animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
