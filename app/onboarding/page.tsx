import Link from "next/link";
import { redirect } from "next/navigation";

import { saveOnboardingAction } from "@/app/actions";
import { ProfileForm } from "@/app/_components/ProfileForm";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/db";

export default async function OnboardingPage() {
  const user = await requireUser();
  const existing = await getProfile(user.id);

  // If the user has already onboarded (profile with the two required
  // fields), send them straight to their plan. The home page's "Get
  // my plan" CTA links here unconditionally, so returning users would
  // otherwise see a re-onboarding screen with all their answers
  // pre-filled — confusing. They can edit at /profile instead.
  if (existing && existing.city && existing.moveDate) {
    redirect("/plan");
  }

  return (
    <main className="flex flex-col flex-1 items-center">
      <div className="w-full max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="text-sm text-[var(--muted-foreground)] hover:underline"
        >
          ← Back
        </Link>
        <div className="mt-6 mb-6 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-4 py-3 text-sm">
          <p>
            <span className="font-semibold">Private beta.</span> Some rough
            edges. If anything breaks or feels off, send a note via{" "}
            <span className="font-medium">💬 Send feedback</span> in the
            sidebar — we read everything.
          </p>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mt-2">
          Tell us about your move
        </h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          We&apos;ll use this to generate a 7/30/90-day plan personalized to
          your city and interests.
        </p>

        <div className="mt-10">
          <ProfileForm
            existing={existing}
            action={saveOnboardingAction}
            submitLabel="Generate my plan"
          />
        </div>
      </div>
    </main>
  );
}
