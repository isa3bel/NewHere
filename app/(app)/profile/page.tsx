import Link from "next/link";

import { saveProfileAction } from "@/app/actions";
import { ProfileForm } from "@/app/_components/ProfileForm";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/db";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const justSaved = params.saved === "1";

  const user = await requireUser();
  const existing = await getProfile(user.id);
  const isNew = existing === null;

  return (
    <main className="flex flex-col flex-1 items-center">
      <div className="w-full max-w-2xl px-6 py-12">
        <header className="mb-2">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Profile
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">
            {isNew ? "Set up your profile" : "Edit your profile"}
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            {isNew
              ? "Fill this in so we can generate a plan and surface relevant groups for you."
              : "Update your interests or goals — your plan and For You page will adjust automatically."}
          </p>
        </header>

        {justSaved && <SavedBanner />}

        <div className="mt-8">
          <ProfileForm
            existing={existing}
            action={saveProfileAction}
            submitLabel={isNew ? "Save profile" : "Save changes"}
          />
        </div>
      </div>
    </main>
  );
}

function SavedBanner() {
  return (
    <div className="mt-6 rounded-xl border border-[var(--accent)] bg-[var(--card)] px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[var(--accent)]" aria-hidden>
          ✓
        </span>
        <span className="text-sm font-medium">Profile saved.</span>
      </div>
      <Link
        href="/profile"
        className="text-xs text-[var(--muted-foreground)] underline"
      >
        Dismiss
      </Link>
    </div>
  );
}
