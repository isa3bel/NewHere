"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { invalidateCachedSuggestions } from "@/lib/ai/cache";
import {
  backfillKeptMonth1Tile,
  generateMoreTilesForGoal,
} from "@/lib/ai/generate-month-one";
import type { AiMonth1Tile } from "@/lib/ai/types";
import { requireAdmin, requireUser } from "@/lib/auth";
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
  Phase,
  Profile,
  SocialStyle,
  TaskStatus,
} from "@/lib/types";

function readProfileFromForm(userId: string, formData: FormData): Profile {
  // Cap at 80 chars server-side. Neighborhood is interpolated into the
  // AI prompt, so a runaway value here would inflate cost and could be a
  // mild prompt-injection vector. The form input also has maxLength, but
  // never trust the client.
  const neighborhoodRaw = (formData.get("neighborhood") as string) || "";
  const neighborhood = neighborhoodRaw.trim().slice(0, 80) || null;

  // Cap goals at 3, trim each, drop empties. Mirror the GoalsField client
  // cap — never trust the client.
  const goals = (formData.getAll("goals") as string[])
    .map((g) => g.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 3);

  return {
    userId,
    displayName: (formData.get("displayName") as string) || null,
    city: (formData.get("city") as string) || "",
    neighborhood,
    moveDate: (formData.get("moveDate") as string) || "",
    socialStyle: (formData.get("socialStyle") as SocialStyle) || "ambivert",
    hasCar: formData.get("hasCar") === "on",
    budgetTier: (formData.get("budgetTier") as BudgetTier) || "medium",
    interests: formData.getAll("interests") as string[],
    goals,
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
  // Backfill is triggered by markForYouCompletedAction (the Done
  // click), which is always the first engagement on an AI tile.
  // Subsequent Keep / Maybe / Not-for-me state changes don't need to
  // re-backfill since the replacement is already queued from Done.
  revalidatePath("/plan");
}

// Identifies static starter tasks by source id prefix. These come from
// mockTasks / deepening templates and don't have AI-tile equivalents
// in the suggestion cache to backfill.
function isStaticSourceId(id: string): boolean {
  return (
    id.startsWith("w1-") ||
    id.startsWith("m1-") ||
    id.startsWith("q1-") ||
    id.startsWith("deepen:")
  );
}

export async function dismissCelebrationAction() {
  const cookieStore = await cookies();
  cookieStore.delete(CELEBRATION_COOKIE);
  revalidatePath("/plan");
}

export type FeedbackCategory = "bug" | "suggestion" | "general";

export type SubmitFeedbackResult =
  | { status: "ok" }
  | { status: "error"; message: string };

// Records a feedback row from /feedback. Auth-only — user_id is taken
// from the session and email is snapshotted at submit time so
// downstream account-deletion doesn't erase the report's context.
export async function submitFeedbackAction(
  _prev: SubmitFeedbackResult | null,
  formData: FormData,
): Promise<SubmitFeedbackResult> {
  const user = await requireUser();
  const category = formData.get("category") as FeedbackCategory | null;
  const message = ((formData.get("message") as string) || "").trim();
  const context = ((formData.get("context") as string) || "").trim() || null;

  if (!category || !["bug", "suggestion", "general"].includes(category)) {
    return { status: "error", message: "Pick a category." };
  }
  if (message.length < 4) {
    return { status: "error", message: "Tell us a bit more (min ~4 chars)." };
  }
  if (message.length > 4000) {
    return { status: "error", message: "Keep it under 4000 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    user_email: user.email,
    category,
    message,
    context: context ? context.slice(0, 500) : null,
  });
  if (error) {
    return { status: "error", message: `Submit failed: ${error.message}` };
  }
  return { status: "ok" };
}

// Admin-only: toggle a feedback row between resolved and reopened.
// Drives the "Mark resolved" / "Reopen" buttons on /admin/feedback.
// Uses the service-role client because RLS limits regular SELECT/UPDATE
// to the row owner — and the admin isn't necessarily the reporter.
export async function setFeedbackStatusAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const nextStatus = formData.get("nextStatus") as
    | "new"
    | "resolved"
    | "reviewing"
    | "dismissed";
  if (!id || !nextStatus) return;

  const admin = createSupabaseAdminClient();
  await admin.from("feedback").update({ status: nextStatus }).eq("id", id);
  revalidatePath("/admin/feedback");
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

// "Refresh" on the pre-move suggestions block. Drops the cache so the
// next page load regenerates fresh content. Rate-limited at the
// generation layer (PER_USER_DAILY_GENERATION_LIMIT) — this action
// itself just invalidates.
export async function refreshAiSuggestionsAction(args: {
  surface: "pre_move" | "month_1";
}) {
  const user = await requireUser();
  await invalidateCachedSuggestions(user.id, args.surface);
  revalidatePath("/plan");
}

export type LoadMoreMonth1Result =
  | { status: "ok"; tiles: AiMonth1Tile[] }
  | { status: "error"; message: string };

// "Load more" on a single Month 1 goal section. Fresh AI call each time
// — not cached, so a page refresh resets the user to the default tile
// set. Still counts toward PER_USER_DAILY_GENERATION_LIMIT so it can't
// be spammed across sessions. The client component limits to one click
// per goal per page load.
export async function loadMoreMonth1TilesAction(args: {
  goal: string;
  excludeIds: string[];
}): Promise<LoadMoreMonth1Result> {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile) {
    return { status: "error", message: "No profile found." };
  }
  if (!profile.goals.includes(args.goal)) {
    return { status: "error", message: "Goal not part of your profile." };
  }

  const result = await generateMoreTilesForGoal(
    user.id,
    profile,
    args.goal,
    args.excludeIds.slice(0, 50),
  );
  if (result.status === "failed" || result.data.length === 0) {
    return {
      status: "error",
      message: "Couldn't load more right now — try again later.",
    };
  }
  return { status: "ok", tiles: result.data };
}

// "Mark done" on a pre-move recommendation: the user has already done it
// (or doesn't need to plan for it) and wants credit. Adds the task to
// their plan AND flips it to done in one click — so it shows up in their
// history, contributes to badges, and the row reflects the completed
// state. Idempotent: re-clicking on an already-done task is a no-op.
export async function markForYouCompletedAction(args: {
  item: ForYouItem;
  interest: string;
  phase?: Phase;
}) {
  const user = await requireUser();
  const [profile, plan] = await Promise.all([
    getProfile(user.id),
    getActivePlan(user.id),
  ]);
  if (!plan) return;

  const currentDay = profile?.moveDate ? daysSinceMove(profile.moveDate) : 0;
  // createTaskFromForYou is idempotent — returns the existing row if it
  // already exists, otherwise inserts a new pending one.
  const task = await createTaskFromForYou(
    user.id,
    plan.id,
    args.item,
    currentDay,
    args.phase,
    profile?.city ?? null,
  );

  // Now flip to done. Routes through badge evaluation so any milestones
  // crossed by this completion are awarded too.
  const { newlyEarned } = await toggleTaskAndAwardBadges(
    user.id,
    task.id,
    "done",
  );

  if (newlyEarned.length > 0) {
    const cookieStore = await cookies();
    cookieStore.set(
      CELEBRATION_COOKIE,
      newlyEarned.map((b) => b.id).join(","),
      { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 },
    );
  }

  // Month 1 AI tiles: kick off a background backfill so the slot
  // gets refilled with a fresh suggestion by the next page load.
  // Skipped for pre-move and static starter tasks.
  if (
    args.phase === "month_one" &&
    task.sourceItemId &&
    !isStaticSourceId(task.sourceItemId) &&
    profile
  ) {
    const sourceItemId = task.sourceItemId;
    const userId = user.id;
    const userProfile = profile;
    after(async () => {
      await backfillKeptMonth1Tile(userId, userProfile, sourceItemId);
    });
  }

  revalidatePath("/plan");
}
