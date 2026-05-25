import { cookies } from "next/headers";

export const CELEBRATION_COOKIE = "newhere_just_earned";

// Server-side cookie read: returns the IDs of badges the user has just earned,
// so the dashboard can render a one-time celebration banner.
export async function readCelebrationBadgeIds(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CELEBRATION_COOKIE)?.value;
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}
