"use client";

import { useActionState } from "react";

import { sendMagicLinkAction, type SignInResult } from "./actions";

export function SignInForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<SignInResult | null, FormData>(
    sendMagicLinkAction,
    null,
  );

  if (state?.status === "sent") {
    return (
      <div className="rounded-2xl border border-[var(--accent)] bg-[var(--card)] p-6 text-center">
        <p className="text-3xl mb-3" aria-hidden>
          📬
        </p>
        <h2 className="text-lg font-semibold mb-1">Check your inbox</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          We sent a sign-in link to <strong>{state.email}</strong>. Tap the
          link to finish signing in. You can close this tab.
        </p>
        <p className="mt-4 text-xs text-[var(--muted-foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2">
          ⚠️ Don&apos;t see it? <strong>Check your spam or junk folder</strong>{" "}
          — magic links sometimes land there. If you find ours there,
          marking it as &ldquo;not spam&rdquo; helps future links land
          properly.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="block text-sm font-medium mb-1">Email</span>
        <input
          type="email"
          name="email"
          required
          autoFocus
          placeholder="you@example.com"
          className="w-full h-12 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] font-medium hover:opacity-90 transition disabled:opacity-60"
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
      {state?.status === "error" && (
        <p className="text-sm text-red-600 mt-2">{state.message}</p>
      )}
    </form>
  );
}
