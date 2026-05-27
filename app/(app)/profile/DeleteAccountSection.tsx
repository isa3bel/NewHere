"use client";

import { useState, useTransition } from "react";

import { deleteAccountAction } from "@/app/actions";

// "Danger zone" with a two-step confirm: user has to type DELETE into a
// box to enable the destructive button. Prevents accidents.
export function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();
  const enabled = confirmText === "DELETE";

  return (
    <section className="mt-12 rounded-2xl border border-red-300 bg-red-50 p-5">
      <h2 className="text-base font-semibold text-red-900">Danger zone</h2>
      <p className="mt-1 text-sm text-red-900/80">
        Delete your account and all your data. This includes your profile,
        plan, all tasks, anchors, and badge progress. This can&apos;t be
        undone.
      </p>

      <div className="mt-4">
        <label className="block">
          <span className="block text-xs font-medium text-red-900 mb-1">
            Type <strong>DELETE</strong> to confirm
          </span>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full max-w-xs h-10 rounded-lg border border-red-300 bg-white px-3 outline-none focus:border-red-500 text-sm"
          />
        </label>

        <button
          type="button"
          disabled={!enabled || pending}
          onClick={() => startTransition(() => deleteAccountAction())}
          className="mt-3 inline-flex h-10 items-center rounded-full bg-red-600 px-5 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Deleting…" : "Permanently delete my account"}
        </button>
      </div>
    </section>
  );
}
