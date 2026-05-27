import Link from "next/link";

import { saveOnboardingAction } from "@/app/actions";
import { ProfileForm } from "@/app/_components/ProfileForm";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/db";

export default async function OnboardingPage() {
  const user = await requireUser();
  const existing = await getProfile(user.id);

  return (
    <main className="flex flex-col flex-1 items-center">
      <div className="w-full max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="text-sm text-[var(--muted-foreground)] hover:underline"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight mt-6">
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
