import { NextResponse, type NextRequest } from "next/server";

import { requireUser } from "@/lib/auth";

// Server-side proxy for Mapbox Search Box suggest endpoint. The token
// stays on the server — the browser only ever talks to /api/mapbox/*.
//
// Auth-required: only logged-in users can use the autocomplete. The
// onboarding and profile pages both require auth before the form
// renders, so this is just defense-in-depth against direct calls to
// /api/mapbox/* from outside.

const MAPBOX_SUGGEST_URL =
  "https://api.mapbox.com/search/searchbox/v1/suggest";

export async function GET(request: NextRequest) {
  await requireUser();

  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Mapbox not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ suggestions: [] });
  }

  // Build the upstream URL with a narrow whitelist of pass-through
  // params. We never forward the user's headers or arbitrary keys to
  // Mapbox.
  const upstream = new URL(MAPBOX_SUGGEST_URL);
  upstream.searchParams.set("q", q.slice(0, 200));
  upstream.searchParams.set("access_token", token);

  const sessionToken = searchParams.get("session_token");
  if (sessionToken) {
    upstream.searchParams.set("session_token", sessionToken.slice(0, 64));
  }
  const types = searchParams.get("types");
  if (types) upstream.searchParams.set("types", types.slice(0, 100));
  const proximity = searchParams.get("proximity");
  if (proximity) upstream.searchParams.set("proximity", proximity.slice(0, 80));
  upstream.searchParams.set("limit", searchParams.get("limit") ?? "5");

  try {
    const res = await fetch(upstream.toString());
    if (!res.ok) {
      return NextResponse.json(
        { error: "Mapbox request failed", status: res.status },
        { status: 502 },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}
