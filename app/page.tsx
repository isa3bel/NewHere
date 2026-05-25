import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col flex-1 items-center">
      <section className="w-full max-w-3xl px-6 pt-24 pb-16 sm:pt-32">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)] mb-6">
          NewHere
        </p>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-tight">
          A 30-day plan for actually
          <br />
          building a life in your new city.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-[var(--muted-foreground)] max-w-xl">
          Skip the overwhelm. Answer a few questions and we&apos;ll generate a
          personalized checklist — communities, hobbies, and routines tailored
          to where you&apos;re moving and what you care about.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/onboarding"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-base font-medium text-[var(--accent-foreground)] hover:opacity-90 transition"
          >
            Get my plan
          </Link>
          <Link
            href="/plan"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] px-7 text-base font-medium hover:bg-[var(--muted)] transition"
          >
            View sample plan
          </Link>
        </div>
      </section>

      <section className="w-full max-w-3xl px-6 pb-24">
        <h2 className="text-2xl font-semibold tracking-tight mb-8">
          How it works
        </h2>
        <ol className="grid sm:grid-cols-3 gap-4">
          <Step
            num="1"
            title="Tell us about you"
            body="Your city, move date, interests, and how social you want to be."
          />
          <Step
            num="2"
            title="Get your plan"
            body="A 30-day checklist of community, hobby, routine, and exploration actions."
          />
          <Step
            num="3"
            title="Check things off"
            body="Earn badges as you go. Adjust your plan anytime."
          />
        </ol>
      </section>
    </main>
  );
}

function Step({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="text-xs font-semibold text-[var(--accent)] mb-3">
        STEP {num}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)]">{body}</p>
    </li>
  );
}
