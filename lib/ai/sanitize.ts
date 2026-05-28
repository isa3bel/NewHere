// Strip Claude's web-search citation wrappers from generated text.
//
// When the web_search tool is enabled, the model annotates cited facts
// with <cite index="X-Y">...</cite> tags. React renders these as
// literal text (it escapes HTML), so they show up as visible tag
// strings in the UI. Strip them here at parse time before caching, so
// no row ever stores polluted text.
//
// Only the wrapper is removed — the inner content is preserved. Also
// collapses any double-space artifact left behind.
const CITE_TAG_RE = /<\/?cite\b[^>]*>/gi;

export function stripCitations(text: string): string {
  return text.replace(CITE_TAG_RE, "").replace(/  +/g, " ").trim();
}

export function stripCitationsOptional(
  text: string | undefined,
): string | undefined {
  return text === undefined ? undefined : stripCitations(text);
}

// Removes items with duplicate `url` from a list. The model occasionally
// returns the same URL twice (different labels, sometimes identical) —
// rendering both causes React key collisions and shows the user a
// confusing duplicate row. First occurrence wins.
export function uniqByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }
  return out;
}
