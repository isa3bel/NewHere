import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Renamed from `middleware.ts` in Next.js 16. The function below used to
// be called `middleware`; the convention name in v16+ is `proxy`.
// Behavior is identical — runs before every matching request, refreshes
// Supabase's auth cookie, and gates auth-protected routes.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// Run on all routes except static assets + the API images route.
// The Supabase docs recommend this matcher to avoid spurious cookie
// refreshes on every image/font request.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
