"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { CELEBRATION_COOKIE } from "@/lib/celebration";
import { toggleTaskAndAwardBadges, upsertProfile } from "@/lib/db";
import type {
  BudgetTier,
  Profile,
  SocialEnergy,
  TaskStatus,
} from "@/lib/types";

export async function saveOnboardingAction(formData: FormData) {
  const user = await requireUser();

  const profile: Profile = {
    userId: user.id,
    displayName: (formData.get("displayName") as string) || null,
    city: (formData.get("city") as string) || "",
    moveDate: (formData.get("moveDate") as string) || "",
    socialEnergy: (formData.get("socialEnergy") as SocialEnergy) || "medium",
    hasCar: formData.get("hasCar") === "on",
    budgetTier: (formData.get("budgetTier") as BudgetTier) || "medium",
    interests: formData.getAll("interests") as string[],
    priorities: formData.getAll("priorities") as string[],
  };

  await upsertProfile(profile);
  redirect("/plan");
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

export async function dismissCelebrationAction() {
  const cookieStore = await cookies();
  cookieStore.delete(CELEBRATION_COOKIE);
  revalidatePath("/plan");
}
