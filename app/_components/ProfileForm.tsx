import { GoalsField } from "@/app/onboarding/GoalsField";
import { InterestsField } from "@/app/onboarding/InterestsField";
import { LocationFields } from "@/app/onboarding/LocationFields";
import {
  GOAL_TAGS,
  INTEREST_TAGS,
  type BudgetTier,
  type Profile,
  type SocialStyle,
} from "@/lib/types";

const SOCIAL_STYLE_OPTIONS: { style: SocialStyle; blurb: string }[] = [
  {
    style: "introvert",
    blurb:
      "I recharge alone. I'd rather do 1-on-1 hangs or solo activities than big group events.",
  },
  {
    style: "ambivert",
    blurb:
      "Depends on the day. Some socializing energizes me, but I need quiet time to balance it.",
  },
  {
    style: "extrovert",
    blurb:
      "I get energy from people. The more events, meetups, and group activities, the better.",
  },
];

const BUDGET_OPTIONS: { tier: BudgetTier; range: string; blurb: string }[] = [
  {
    tier: "low",
    range: "$0–50 / month",
    blurb:
      "Free events, parks, libraries, walks. I'll skip anything with a steep cover or membership fee.",
  },
  {
    tier: "medium",
    range: "$50–200 / month",
    blurb:
      "Open to a gym membership or occasional class. A monthly meetup or two with a small fee is fine.",
  },
  {
    tier: "high",
    range: "$200+ / month",
    blurb:
      "Happy to invest — premium classes, regular dining out, weekend trips, paid memberships.",
  },
];

type Props = {
  existing: Profile | null;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

// Shared profile form used by both /onboarding (first-time) and /profile
// (edit). The form action is passed in so each route controls its own
// post-submit redirect.
export function ProfileForm({ existing, action, submitLabel }: Props) {
  return (
    <form action={action} className="space-y-8">
      <Field label="Your name">
        <input
          type="text"
          name="displayName"
          defaultValue={existing?.displayName ?? ""}
          placeholder="Isabel"
          className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
        />
      </Field>

      <LocationFields
        defaultCity={existing?.city}
        defaultNeighborhood={existing?.neighborhood}
        mapboxEnabled={Boolean(process.env.MAPBOX_TOKEN)}
      />

      <Field label="Move date" required>
        <input
          type="date"
          name="moveDate"
          required
          defaultValue={existing?.moveDate ?? ""}
          className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
        />
      </Field>

      <Field label="How outgoing are you?">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SOCIAL_STYLE_OPTIONS.map((opt) => (
            <label
              key={opt.style}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-left has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)] has-[:checked]:text-[var(--accent-foreground)]"
            >
              <input
                type="radio"
                name="socialStyle"
                value={opt.style}
                defaultChecked={existing?.socialStyle === opt.style}
                className="sr-only"
              />
              <div className="font-semibold capitalize">{opt.style}</div>
              <p className="text-sm mt-2 leading-snug">{opt.blurb}</p>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Budget for activities">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {BUDGET_OPTIONS.map((opt) => (
            <label
              key={opt.tier}
              className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-left has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent)] has-[:checked]:text-[var(--accent-foreground)]"
            >
              <input
                type="radio"
                name="budgetTier"
                value={opt.tier}
                defaultChecked={existing?.budgetTier === opt.tier}
                className="sr-only"
              />
              <div className="font-semibold capitalize">{opt.tier}</div>
              <div className="text-xs mt-0.5 opacity-80">{opt.range}</div>
              <p className="text-sm mt-2 leading-snug">{opt.blurb}</p>
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

      <Field label="What are you into? (pick any, or add your own)">
        <InterestsField
          name="interests"
          predefined={INTEREST_TAGS}
          defaultSelected={existing?.interests ?? []}
        />
      </Field>

      <Field
        label="What're your top three goals?"
        required
        hint="Pick up to three — or add your own. These shape which 'Try things' suggestions appear in Month 1."
      >
        <GoalsField
          name="goals"
          predefined={GOAL_TAGS}
          defaultSelected={existing?.goals ?? []}
        />
      </Field>

      <button
        type="submit"
        className="w-full h-12 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] font-medium hover:opacity-90 transition"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 font-medium">
        {label}
        {required && <span className="text-[var(--accent)] ml-1">*</span>}
      </div>
      {hint && (
        <p className="mb-2 -mt-1 text-xs text-[var(--muted-foreground)]">
          {hint}
        </p>
      )}
      {children}
    </label>
  );
}
