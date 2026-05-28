"use client";

import { useActionState, useEffect, useRef } from "react";

import { submitFeedbackAction, type SubmitFeedbackResult } from "@/app/actions";

const CATEGORIES: { value: "bug" | "suggestion" | "general"; label: string; blurb: string }[] = [
  {
    value: "bug",
    label: "🐞 Bug",
    blurb: "Something broke or behaved unexpectedly.",
  },
  {
    value: "suggestion",
    label: "💡 Suggestion",
    blurb: "An idea for something we could add or change.",
  },
  {
    value: "general",
    label: "💬 General",
    blurb: "Anything else — questions, comments, kind words.",
  },
];

export function FeedbackForm() {
  const [result, formAction, pending] = useActionState<
    SubmitFeedbackResult | null,
    FormData
  >(submitFeedbackAction, null);

  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (result?.status === "ok") {
      formRef.current?.reset();
    }
  }, [result]);

  if (result?.status === "ok") {
    return (
      <div className="rounded-2xl border-2 border-[var(--accent)] bg-[var(--card)] p-6">
        <p className="text-lg font-semibold">Thanks — we got it. 🙌</p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          We&apos;ll take a look. You don&apos;t need to follow up; if it&apos;s
          a bug we can reproduce, we&apos;ll fix it and you&apos;ll see it
          in the next deploy.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ↻ Send another
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <Field label="What kind of feedback?" required>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <label
              key={c.value}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-left has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)] has-[:checked]:text-[var(--accent-foreground)]"
            >
              <input
                type="radio"
                name="category"
                value={c.value}
                required
                className="sr-only"
                defaultChecked={c.value === "bug"}
              />
              <div className="font-semibold">{c.label}</div>
              <p className="text-xs mt-1 leading-snug">{c.blurb}</p>
            </label>
          ))}
        </div>
      </Field>

      <Field label="What's up?" required>
        <textarea
          name="message"
          required
          minLength={4}
          maxLength={4000}
          rows={6}
          placeholder="Be specific where you can — what you saw, what you expected, what you tried."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 outline-none focus:border-[var(--accent)] resize-y"
        />
      </Field>

      <Field
        label="Where did this happen? (optional)"
        hint="e.g. 'on /plan after clicking Refresh', or 'on mobile while signing in'"
      >
        <input
          type="text"
          name="context"
          maxLength={500}
          className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
        />
      </Field>

      {result?.status === "error" && (
        <p className="text-sm text-red-600">{result.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-11 px-6 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 font-medium">
        {label}
        {required && <span className="text-[var(--accent)] ml-1">*</span>}
      </div>
      {hint && (
        <p className="mb-2 -mt-1 text-xs text-[var(--muted-foreground)]">
          {hint}
        </p>
      )}
      {children}
    </label>
  );
}
