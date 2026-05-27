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
