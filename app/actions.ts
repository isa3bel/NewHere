"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { CELEBRATION_COOKIE } from "@/lib/celebration";
import {
  createTaskFromForYou,
  getActivePlan,
  getProfile,
  getSavedItems,
  resetPlanProgress,
  saveForYouItem,
  setSavedItemState,
  setTaskKeeperState,
  toggleTaskAndAwardBadges,
  unsaveForYouItem,
  upsertProfile,
} from "@/lib/db";
import type { ForYouItem } from "@/lib/for-you-data";
import { daysSinceMove } from "@/lib/plan-progress";
import type {
  BudgetTier,
  KeeperState,
  Profile,
  SavedItemState,
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
  revalidatePath("/for-you");
}

export async function dismissCelebrationAction() {
  const cookieStore = await cookies();
  cookieStore.delete(CELEBRATION_COOKIE);
  revalidatePath("/plan");
}

// --- For You: save / shortlist actions ---------------------------------

export async function toggleSaveForYouAction(args: {
  item: ForYouItem;
  interest: string;
  currentlySaved: boolean;
}) {
  const user = await requireUser();
  if (args.currentlySaved) {
    await unsaveForYouItem(user.id, args.item.id);
  } else {
    await saveForYouItem(user.id, args.item, args.interest, "shortlist");
  }
  revalidatePath("/for-you");
  revalidatePath("/plan");
}

export async function setSavedStateAction(args: {
  forYouItemId: string;
  state: SavedItemState;
}) {
  const user = await requireUser();
  await setSavedItemState(user.id, args.forYouItemId, args.state);
  revalidatePath("/for-you");
}

export async function addForYouToPlanAction(args: {
  item: ForYouItem;
  interest: string;
}) {
  const user = await requireUser();
  const [profile, plan, existingSaved] = await Promise.all([
    getProfile(user.id),
    getActivePlan(user.id),
    getSavedItems(user.id),
  ]);
  if (!plan) return;

  const currentDay = profile?.moveDate ? daysSinceMove(profile.moveDate) : 0;
  await createTaskFromForYou(user.id, plan.id, args.item, currentDay);

  // Make sure the source is saved so it appears in the shortlist. Preserve
  // whatever state it's already in — Going is for events the user explicitly
  // committed to, not the default for everything added to the plan.
  const already = existingSaved.find((s) => s.forYouItemId === args.item.id);
  if (!already) {
    await saveForYouItem(user.id, args.item, args.interest, "shortlist");
  }

  revalidatePath("/for-you");
  revalidatePath("/plan");
}
