import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. Bypasses Row Level Security.
//
// ONLY use this from server-side code (server actions, route handlers,
// background jobs) for admin operations that intentionally aren't
// available to the user's authenticated client. Examples:
//   - Granting badges (user_badges INSERT — RLS doesn't allow client writes)
//   - Seed scripts, migrations, admin tools
//
// NEVER use this in a Client Component. NEVER pass the result of a query
// from this client back to the client without explicit auth checks —
// the service role bypasses RLS, so it sees every user's data.
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
