import { requireUser } from "@/lib/auth";

import { FeedbackForm } from "./FeedbackForm";

export default async function FeedbackPage() {
  // Auth-gated. Anonymous reports would invite spam; tying to a user_id
  // also gives us context for follow-up.
  await requireUser();

  return (
    <main className="flex flex-col flex-1 items-center">
      <div className="w-full max-w-2xl px-6 py-12">
        <header className="mt-2">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Feedback
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">
            Send us a note
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            We&apos;re in early beta — every bug, gripe, and idea makes the
            next version better. Submissions land directly in our internal
            dashboard.
          </p>
        </header>

        <div className="mt-10">
          <FeedbackForm />
        </div>
      </div>
    </main>
  );
}
