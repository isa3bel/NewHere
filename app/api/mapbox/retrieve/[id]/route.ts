import { NextResponse, type NextRequest } from "next/server";

import { requireUser } from "@/lib/auth";

// Server-side proxy for Mapbox Search Box retrieve endpoint. Used to
// fetch coordinates of a selected city so the neighborhood
// autocomplete can bias its results by proximity.

const MAPBOX_RETRIEVE_URL =
  "https://api.mapbox.com/search/searchbox/v1/retrieve";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireUser();

  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Mapbox not configured" },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  if (!id || id.length > 200) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const sessionToken = searchParams.get("session_token");

  const upstream = new URL(`${MAPBOX_RETRIEVE_URL}/${encodeURIComponent(id)}`);
  upstream.searchParams.set("access_token", token);
  if (sessionToken) {
    upstream.searchParams.set("session_token", sessionToken.slice(0, 64));
  }

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
