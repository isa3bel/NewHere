import Link from "next/link";

import { SearchProgress } from "../SearchProgress";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/db";

// Preview route for the AI-search loading state. Loops the stage messages
// indefinitely until you navigate away. Delete this file once the real
// AI-powered search is in place — SearchProgress moves into a <Suspense>
// fallback on the main For You page at that point.
export default async function LoadingPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "barre fitness classes").trim();

  const user = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <main className="flex flex-col flex-1 items-center">
      <div className="w-full max-w-5xl px-6 py-12">
        <Link
          href="/for-you"
          className="text-sm text-[var(--muted-foreground)] hover:underline"
        >
          ← Back to For You
        </Link>

        <header className="mt-6">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Loading-state preview
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">
            What AI search will look like while it&apos;s thinking
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            This is the React Suspense fallback that will render while Claude
            is running web_search and extracting results. Refresh to watch the
            stages cycle again.
          </p>
        </header>

        <SearchProgress query={query} city={profile?.city} />

        <p className="mt-8 text-xs text-[var(--muted-foreground)] italic">
          Try a different query: <Link href="/for-you/loading-preview?q=AI+meetups" className="underline">AI meetups</Link> · <Link href="/for-you/loading-preview?q=climbing+gym" className="underline">climbing gym</Link> · <Link href="/for-you/loading-preview?q=indie+bookstores" className="underline">indie bookstores</Link>
        </p>
      </div>
    </main>
  );
}
