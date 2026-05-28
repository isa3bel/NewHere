"use client";

import { useState } from "react";

// Shown at the top of /plan when at least one AI surface (pre_move or
// week_one) failed this render. Two options:
//   - "Try again" → reload the page (which re-attempts the AI call)
//   - "Use generic plan" → dismiss the banner client-side. The page
//     already renders fine with generic content; this just hides the
//     prompt. Dismiss is per-session only — refresh shows it again if
//     AI is still failing.
export function AiFailureBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden>
          ⚠️
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-900">
            We couldn&apos;t personalize your plan right now.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            The personalization service is unreachable. You can refresh to
            try again, or continue with a generic plan for now — every task
            still works, it just won&apos;t reference your city by name.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm font-medium px-3 py-1.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition"
            >
              ↻ Try again
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-sm font-medium px-3 py-1.5 rounded-full border border-amber-300 text-amber-900 hover:bg-amber-100 transition"
            >
              Use generic plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
