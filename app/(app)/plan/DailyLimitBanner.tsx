// Shown at the top of /plan when the user has exhausted their daily
// AI generation cap. Takes priority over AiFailureBanner — when both
// are technically true, this one is the more specific + actionable
// message (the cap is the *reason* fresh suggestions aren't appearing,
// not a transient outage).
//
// Server-rendered (no client interactivity needed). The cap resets at
// server-local midnight; we surface the current count + limit so the
// user knows where they stand.
export function DailyLimitBanner({
  count,
  limit,
}: {
  count: number;
  limit: number;
}) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden>
          ⏳
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-900">
            You&apos;ve hit today&apos;s personalization limit ({count}/
            {limit}).
          </p>
          <p className="mt-1 text-sm text-amber-800">
            You can keep marking things done and exploring what&apos;s
            already in your plan — fresh suggestions and load-more resume
            tomorrow. The cap keeps costs sustainable during the private
            beta.
          </p>
        </div>
      </div>
    </div>
  );
}
