import { MOCK_USER_ID } from "./mock-data";

export type SessionUser = {
  id: string;
  email: string;
};

// Returns the currently signed-in user, or null. For MVP this always returns
// the mock user; replace with Supabase Auth (`supabase.auth.getUser()`) later.
export async function getCurrentUser(): Promise<SessionUser | null> {
  return {
    id: MOCK_USER_ID,
    email: "demo@newhere.app",
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not signed in");
  }
  return user;
}
