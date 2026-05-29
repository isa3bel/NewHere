import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/db";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    const profile = await getProfile(user.id);
    if (profile) {
      redirect("/plan");
    }
  }

  return (
    <main className="flex flex-col flex-1 items-center">
      <section className="w-full max-w-4xl px-6 pt-24 pb-20 sm:pt-32">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-8">
          NewHere
        </p>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
          A plan for your
          <br />
          first 90 days.
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-[var(--muted-foreground)] max-w-xl leading-relaxed">
          Personalized to your city, your interests, and how social you want
          to be. Three phases, one checklist — so you can stop figuring out
          what to do and just do it.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <Link
            href="/onboarding"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-base font-medium text-[var(--accent-foreground)] hover:opacity-90 transition"
          >
            Get my plan →
          </Link>
          <Link
            href="/sample"
            className="text-base font-medium text-[var(--foreground)] hover:text-[var(--accent)] underline-offset-4 hover:underline transition"
          >
            View a sample plan
          </Link>
        </div>

        <PreviewCard />
      </section>

      <section className="w-full max-w-4xl px-6 pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-10">
          How it works
        </p>
        <div className="space-y-12">
          <Phase
            label="Week 1"
            title="Land & settle"
            body="The essentials, ordered for your city — driver's license, transit pass, a grocery store that becomes your grocery store. The small stuff that quietly makes a place feel livable."
          />
          <Phase
            label="Month 1"
            title="Try things"
            body="Real local clubs, classes, and communities that match what you're into. Mark the ones that stick; we drop the rest. You don't need to fall in love with all of them — just one or two."
          />
          <Phase
            label="Quarter 1"
            title="Make it yours"
            body="Your keepers from Month 1 become weekly anchors. Your anchors become a routine. Your routine becomes a life that fits this place."
          />
        </div>
      </section>

      <section className="w-full max-w-4xl px-6 pb-28">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Ready when you are.
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Free during private beta · No credit card · Save with a magic
              link.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-base font-medium text-[var(--accent-foreground)] hover:opacity-90 transition self-start sm:self-auto flex-shrink-0"
          >
            Get my plan →
          </Link>
        </div>
      </section>
    </main>
  );
}

// Inline stylized preview that mirrors the shape of a real plan task,
// so the landing page communicates what the product actually outputs
// without needing a screenshot.
function PreviewCard() {
  return (
    <div className="mt-16 sm:mt-20 max-w-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-3">
        A sample task in your plan
      </p>
      <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full border-2 border-[var(--border)]"
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base leading-snug">
              Find a coffee shop you can become a regular at
            </h3>
            <p className="mt-1 text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
              Austin · Week 1 · Day 4
            </p>
            <div className="mt-4 space-y-1.5 text-sm text-[var(--muted-foreground)]">
              <Line label="Try" value="Fleet Coffee Co · East Cesar Chavez" />
              <Line label="When" value="7am – 4pm weekdays" />
              <Line label="Cost" value="$4–6 per visit" />
              <Line
                label="How"
                value="Walk in. Order something simple. Repeat twice — by visit 3 they recognize you."
              />
            </div>
          </div>
        </div>
      </article>
      <p className="mt-3 text-xs text-[var(--muted-foreground)]">
        Your plan has ~30 of these — Week 1 essentials, Month 1 communities to
        try, Quarter 1 routines to keep.
      </p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="font-medium text-[var(--foreground)] w-12 flex-shrink-0">
        {label}
      </span>
      <span className="flex-1">{value}</span>
    </div>
  );
}

function Phase({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid sm:grid-cols-[8rem_1fr] gap-2 sm:gap-8">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] sm:pt-1">
        {label}
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {title}
        </h3>
        <p className="mt-2 text-[var(--muted-foreground)] leading-relaxed max-w-2xl">
          {body}
        </p>
      </div>
    </div>
  );
}
