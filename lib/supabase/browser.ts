import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Use this from Client Components for
// auth flows that originate in the browser (e.g. magic-link request).
// Reads the public env vars baked into the JS bundle.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
