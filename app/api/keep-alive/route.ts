import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Keep-alive endpoint, hit on a schedule by a Vercel Cron Job (see
// vercel.json). Supabase pauses free-tier projects after ~7 days with no
// external API activity; a lightweight query here every day counts as
// activity and keeps the database from being paused.
//
// Gated by CRON_SECRET so only Vercel's scheduler can trigger it — Vercel
// automatically sends `Authorization: Bearer <CRON_SECRET>` when that env
// var is set. Reading the header also forces this route to run at request
// time rather than being prerendered.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // A real PostgREST/DB query is what counts as activity — `head: true`
  // fetches only the count, no rows, so it's as cheap as possible.
  const supabase = createSupabaseAdminClient();
  const { error, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (error) {
    // Surface the failure so a glance at the response (or Vercel logs)
    // tells you the keep-alive isn't actually reaching the database.
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, profiles: count ?? 0 });
}
