import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// Handles the redirect target from a magic link email. Exchanges the
// `code` query param for a real session (sets the auth cookie), then
// sends the user to whatever `next` path they originally requested.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/plan";

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = new URL(`${origin}/sign-in`);
    url.searchParams.set("error", error.message);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
