"use client";

// Renders a timestamp in the viewer's local timezone. Server components
// would render in UTC (the Vercel runtime) which is confusing for an
// ops dashboard. Using a client component means the format runs in the
// browser — correct timezone, free.
//
// suppressHydrationWarning silences the React hydration warning: the
// server renders the ISO string as-is (no formatting) and the client
// re-renders with the formatted string. The mismatch is intentional.
export function LocalTime({ iso }: { iso: string }) {
  let formatted = iso;
  try {
    formatted = new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    // Fall back to the raw ISO if Date parse somehow fails.
  }
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {formatted}
    </time>
  );
}
