import Link from "next/link";

import { saveOnboardingAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/db";
import { INTEREST_TAGS, PRIORITY_TAGS } from "@/lib/types";

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
          We&apos;ll use this to generate a 30-day plan personalized to your
          city and interests.
        </p>

        <form action={saveOnboardingAction} className="mt-10 space-y-8">
          <Field label="Your name">
            <input
              type="text"
              name="displayName"
              defaultValue={existing?.displayName ?? ""}
              placeholder="Isabel"
              className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
            />
          </Field>

          <Field label="City you're moving to" required>
            <input
              type="text"
              name="city"
              required
              defaultValue={existing?.city ?? ""}
              placeholder="Austin, TX"
              className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
            />
          </Field>

          <Field label="Move date" required>
            <input
              type="date"
              name="moveDate"
              required
              defaultValue={existing?.moveDate ?? ""}
              className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
            />
          </Field>

          <Field label="Social energy">
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((level) => (
                <label
                  key={level}
                  className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-center text-sm capitalize has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)] has-[:checked]:text-[var(--accent-foreground)]"
                >
                  <input
                    type="radio"
                    name="socialEnergy"
                    value={level}
                    defaultChecked={
                      (existing?.socialEnergy ?? "medium") === level
                    }
                    className="sr-only"
                  />
                  {level}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Budget">
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((tier) => (
                <label
                  key={tier}
                  className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-center text-sm capitalize has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)] has-[:checked]:text-[var(--accent-foreground)]"
                >
                  <input
                    type="radio"
                    name="budgetTier"
                    value={tier}
                    defaultChecked={
                      (existing?.budgetTier ?? "medium") === tier
                    }
                    className="sr-only"
                  />
                  {tier}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Do you have a car?">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="hasCar"
                defaultChecked={existing?.hasCar ?? false}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className="text-sm">Yes</span>
            </label>
          </Field>

          <Field label="What are you into? (pick any)">
            <div className="flex flex-wrap gap-2">
              {INTEREST_TAGS.map((tag) => (
                <label
                  key={tag}
                  className="cursor-pointer rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm capitalize has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)] has-[:checked]:text-[var(--accent-foreground)]"
                >
                  <input
                    type="checkbox"
                    name="interests"
                    value={tag}
                    defaultChecked={existing?.interests.includes(tag) ?? false}
                    className="sr-only"
                  />
                  {tag}
                </label>
              ))}
            </div>
          </Field>

          <Field label="What matters most to you right now? (pick any)">
            <div className="flex flex-wrap gap-2">
              {PRIORITY_TAGS.map((tag) => (
                <label
                  key={tag}
                  className="cursor-pointer rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm capitalize has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)] has-[:checked]:text-[var(--accent-foreground)]"
                >
                  <input
                    type="checkbox"
                    name="priorities"
                    value={tag}
                    defaultChecked={
                      existing?.priorities.includes(tag) ?? false
                    }
                    className="sr-only"
                  />
                  {tag}
                </label>
              ))}
            </div>
          </Field>

          <button
            type="submit"
            className="w-full h-12 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] font-medium hover:opacity-90 transition"
          >
            Generate my plan
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 font-medium">
        {label}
        {required && <span className="text-[var(--accent)] ml-1">*</span>}
      </div>
      {children}
    </label>
  );
}
