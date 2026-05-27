import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Server-side Supabase client. Use this in Server Components, Server
// Actions, and route handlers. Reads/writes the auth cookie so the
// signed-in user is preserved across requests.
//
// Each invocation creates a new client bound to the current request's
// cookie store — don't cache or share across requests.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't set cookies — that's fine, the
            // middleware refreshes the session before the route renders.
          }
        },
      },
    },
  );
}
