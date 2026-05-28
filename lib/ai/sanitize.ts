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
