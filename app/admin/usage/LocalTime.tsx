"use client";

import { useEffect, useState } from "react";

const FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

// Formats a timestamp in the viewer's local timezone.
// Server components would format in UTC (Vercel runtime), which makes
// the dashboard misleading. SSR + first client render both produce the
// neutral placeholder so React sees no hydration mismatch. useEffect
// then replaces it with the localized text — visible as soon as JS
// hydrates, which is ~instantly on a small page.
export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState("…");
  useEffect(() => {
    try {
      setText(new Date(iso).toLocaleString(undefined, FORMAT_OPTIONS));
    } catch {
      setText(iso);
    }
  }, [iso]);
  return <time dateTime={iso}>{text}</time>;
}
