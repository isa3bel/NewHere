import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /auth/sign-out — signs the user out and bounces to /sign-in.
// POST (not GET) so that simply visiting a URL can't log you out.
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${request.nextUrl.origin}/sign-in`, {
    status: 303, // see-other: turns the POST redirect into a GET
  });
}
