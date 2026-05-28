import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "./supabase/server";

export type SessionUser = {
  id: string;
  email: string;
};

// Returns the currently signed-in user, or null. Backed by Supabase auth.
// In Server Components and Server Actions, this reads the session from
// the auth cookie set by the magic-link callback.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
  };
}

// Use in Server Components / Actions that must have a signed-in user.
// If there's no session, redirects to /sign-in.
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

// Comma-separated env var. Email match is the simplest source of truth
// at MVP scale — no admin role column needed yet. Trim + lowercase so
// stray whitespace or casing differences don't lock you out.
function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

// Use in admin routes. Requires (a) a signed-in user AND (b) the user's
// email to be in ADMIN_EMAILS. Anything else 404s — we don't reveal that
// the route exists to non-admins.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  const admins = parseAdminEmails();
  if (!admins.has(user.email.toLowerCase())) {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return user;
}
