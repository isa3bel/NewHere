import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Runs on every matching request before the route renders. Two jobs:
//   1. Refresh the Supabase auth cookie so the session stays alive.
//   2. Gate access to the authenticated app — unsigned visitors hitting
//      /plan, /profile, or /onboarding get redirected to /sign-in.
//
// Adapted from Supabase's official @supabase/ssr docs.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: must call getUser() between createServerClient and any
  // logic that needs the user. Without it, the cookie isn't refreshed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Auth-protected paths: must be signed in to access these.
  // /admin/* is gated additionally by requireAdmin() in the route itself
  // (email allowlist); middleware just forces a sign-in first.
  const requiresAuth =
    pathname.startsWith("/plan") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin");

  if (requiresAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // If a signed-in user hits /sign-in, send them home.
  if (pathname === "/sign-in" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/plan";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
