"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { CELEBRATION_COOKIE } from "@/lib/celebration";
import {
  createTaskFromForYou,
  ensurePlanForUser,
  getActivePlan,
  getProfile,
  resetPlanProgress,
  setTaskKeeperState,
  toggleTaskAndAwardBadges,
  upsertProfile,
} from "@/lib/db";
import type { ForYouItem } from "@/lib/for-you-data";
import { daysSinceMove } from "@/lib/plan-progress";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BudgetTier,
  KeeperState,
  Profile,
  SocialStyle,
  TaskStatus,
} from "@/lib/types";

function readProfileFromForm(userId: string, formData: FormData): Profile {
  return {
    userId,
    displayName: (formData.get("displayName") as string) || null,
    city: (formData.get("city") as string) || "",
    moveDate: (formData.get("moveDate") as string) || "",
    socialStyle: (formData.get("socialStyle") as SocialStyle) || "ambivert",
    hasCar: formData.get("hasCar") === "on",
    budgetTier: (formData.get("budgetTier") as BudgetTier) || "medium",
    interests: formData.getAll("interests") as string[],
    goals: formData.getAll("goals") as string[],
  };
}

export async function saveOnboardingAction(formData: FormData) {
  const user = await requireUser();
  await upsertProfile(readProfileFromForm(user.id, formData));
  await ensurePlanForUser(user.id);
  await resetPlanProgress(user.id);
  redirect("/plan");
}

export async function saveProfileAction(formData: FormData) {
  const user = await requireUser();
  await upsertProfile(readProfileFromForm(user.id, formData));
  redirect("/profile?saved=1");
}

export async function toggleTaskAction(formData: FormData) {
  const user = await requireUser();
  const taskId = formData.get("taskId") as string;
  const nextStatus = formData.get("nextStatus") as TaskStatus;

  const { newlyEarned } = await toggleTaskAndAwardBadges(
    user.id,
    taskId,
    nextStatus,
  );

  if (newlyEarned.length > 0) {
    const cookieStore = await cookies();
    cookieStore.set(CELEBRATION_COOKIE, newlyEarned.map((b) => b.id).join(","), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30,
    });
  }

  revalidatePath("/plan");
}

export async function setKeeperStateAction(args: {
  taskId: string;
  state: KeeperState;
}) {
  await requireUser();
  await setTaskKeeperState(args.taskId, args.state);
  revalidatePath("/plan");
}

export async function dismissCelebrationAction() {
  const cookieStore = await cookies();
  cookieStore.delete(CELEBRATION_COOKIE);
  revalidatePath("/plan");
}

// Permanently delete the signed-in user and all their data. The auth.users
// row deletion cascades through profiles → plans → tasks → user_badges via
// `on delete cascade` foreign keys in the schema.
export async function deleteAccountAction() {
  const user = await requireUser();

  const admin = createSupabaseAdminClient();
  const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
  if (deleteErr) {
    throw new Error(`Failed to delete account: ${deleteErr.message}`);
  }

  // Clear the now-stale session cookie.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/");
}

// "+ Add to my plan" on a pre-move recommendation. Creates a task in the
// user's plan from the For You item; idempotent if clicked twice.
export async function addForYouToPlanAction(args: {
  item: ForYouItem;
  interest: string;
}) {
  const user = await requireUser();
  const [profile, plan] = await Promise.all([
    getProfile(user.id),
    getActivePlan(user.id),
  ]);
  if (!plan) return;

  const currentDay = profile?.moveDate ? daysSinceMove(profile.moveDate) : 0;
  await createTaskFromForYou(user.id, plan.id, args.item, currentDay);

  revalidatePath("/plan");
}
