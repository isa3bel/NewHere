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
    <main className="flex flex-col flex-1 items-center overflow-x-hidden">
      <Hero />
      <HowItWorks />
      <SamplePreview />
      <ClosingCTA />
      <Footer />
    </main>
  );
}

// ============================================================
// Footer — dark band with utility links + brand attribution
// ============================================================
function Footer() {
  return (
    <footer className="w-full bg-[#1a1a1a] text-gray-400 rounded-t-3xl mt-12">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 sm:py-14">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          <span className="text-gray-300">© 2026 NewHere</span>
          <Link
            href="/terms"
            className="hover:text-white transition"
          >
            Terms of service
          </Link>
          <Link
            href="/privacy"
            className="hover:text-white transition"
          >
            Privacy policy
          </Link>
          <Link
            href="/sample"
            className="hover:text-white transition"
          >
            Sample plan
          </Link>
          <Link
            href="/feedback"
            className="hover:text-white transition"
          >
            Send feedback
          </Link>
          <Link
            href="/sign-in"
            className="hover:text-white transition"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-8 flex items-center gap-2 text-sm">
          <span>Made with</span>
          <span aria-hidden>💛</span>
          <span>
            by{" "}
            <span className="font-semibold text-gray-200">NewHere</span> ·
            Private beta
          </span>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// Hero
// ============================================================
function Hero() {
  return (
    <section className="relative w-full max-w-6xl px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
      {/* Decorative pastel blobs floating behind the content. */}
      <div
        className="pointer-events-none absolute top-8 -left-12 w-48 h-48 rounded-full bg-pink-300/30 blur-3xl -z-10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-32 right-0 w-56 h-56 rounded-full bg-yellow-300/30 blur-3xl -z-10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-purple-300/30 blur-3xl -z-10"
        aria-hidden
      />

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-6">
            NewHere
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            Land. Try things.{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span
                className="absolute inset-x-[-0.1em] inset-y-[0.15em] -z-10 bg-pink-200 rounded -rotate-1"
                aria-hidden
              />
              Belong
            </span>
            <span className="text-amber-500 ml-1" aria-hidden>
              ✨
            </span>
          </h1>
          <p className="mt-8 text-lg text-[var(--muted-foreground)] max-w-xl leading-relaxed">
            A personalized 90-day plan for your new city — communities,
            hobbies, and the small routines that turn{" "}
            <em className="not-italic font-medium text-[var(--foreground)]">
              &ldquo;new city&rdquo;
            </em>{" "}
            into{" "}
            <em className="not-italic font-medium text-[var(--foreground)]">
              &ldquo;home&rdquo;
            </em>
            .
          </p>
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <Link
              href="/onboarding"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-base font-medium text-[var(--accent-foreground)] hover:opacity-90 transition shadow-sm"
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
        </div>

        {/* Photo collage — hidden on small screens to keep the hero tight. */}
        <div className="relative h-[440px] hidden lg:block">
          <PhotoTile
            src="https://plus.unsplash.com/premium_photo-1664302152991-d013ff125f3f?q=80&w=500&h=500&auto=format&fit=crop"
            alt="Essential moving-day items laid out — the kind of setup you tackle in week 1"
            position="absolute top-0 left-0 w-44 h-44 -rotate-3"
            tag="Week 1 · Set up essentials"
            tagColor="bg-yellow-200"
          />
          <PhotoTile
            src="https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=500&h=500&fit=crop&auto=format&q=80"
            alt="Group of runners on a path"
            position="absolute top-8 right-2 w-52 h-52 rotate-2"
            tag="Month 1 · Run club"
            tagColor="bg-pink-200"
          />
          <PhotoTile
            src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=500&h=500&fit=crop&auto=format&q=80"
            alt="Golden Gate Bridge at sunset"
            position="absolute bottom-0 left-12 w-40 h-40 -rotate-2"
            tag="Quarter 1 · This is home"
            tagColor="bg-purple-200"
          />
          {/* Decorative scribble */}
          <svg
            className="absolute top-32 right-32 w-12 h-12 text-[var(--accent)] opacity-60"
            viewBox="0 0 50 50"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 25 C 15 5, 25 45, 35 25 S 45 5, 45 25"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

function PhotoTile({
  src,
  alt,
  position,
  tag,
  tagColor,
}: {
  src: string;
  alt: string;
  position: string;
  tag: string;
  tagColor: string;
}) {
  return (
    <div className={position}>
      <div className="relative w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-full object-cover rounded-2xl shadow-lg ring-1 ring-black/5"
        />
        <span
          className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 ${tagColor} text-gray-900 px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap shadow-sm ring-1 ring-black/5`}
        >
          {tag}
        </span>
      </div>
    </div>
  );
}

// Same shape as PhotoTile but renders a gradient block with a big
// centered emoji instead of a hot-linked image. Used when there's no
// obvious stock photo for the concept (e.g. "set up essentials").
function IconTile({
  emoji,
  label,
  position,
  tag,
  tagColor,
  bgClassName,
}: {
  emoji: string;
  label: string;
  position: string;
  tag: string;
  tagColor: string;
  bgClassName: string;
}) {
  return (
    <div className={position}>
      <div className="relative w-full h-full">
        <div
          role="img"
          aria-label={label}
          className={`w-full h-full rounded-2xl shadow-lg ring-1 ring-black/5 flex items-center justify-center ${bgClassName}`}
        >
          <span className="text-6xl" aria-hidden>
            {emoji}
          </span>
        </div>
        <span
          className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 ${tagColor} text-gray-900 px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap shadow-sm ring-1 ring-black/5`}
        >
          {tag}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// How it works — zig-zag cards with hand-drawn connecting curves
// ============================================================
function HowItWorks() {
  return (
    <section className="w-full max-w-5xl px-6 py-20 sm:py-28">
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-14 sm:mb-16">
        How NewHere works
      </h2>

      <div className="relative">
        {/* Hand-drawn connecting curves — desktop only. Approximate
            connections between the zig-zag cards; not perfectly anchored
            to edges but enough to suggest flow. */}
        <svg
          className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none text-gray-300"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Card 1 → Card 2 (top-left to top-right) */}
          <path
            d="M 410 100 C 500 60, 540 220, 640 180"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 635 173 L 645 182 L 633 187"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Card 2 → Card 3 (top-right to bottom-center) */}
          <path
            d="M 820 320 C 900 460, 600 440, 540 470"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 548 463 L 540 472 L 552 480"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-x-20">
          <PhaseCard
            position="lg:row-start-1 lg:col-start-1"
            emoji="📍"
            label="Week 1"
            title="Land & settle"
            body="The essentials, ordered for your city — driver's license, transit pass, a grocery store that becomes your grocery store."
            ctaText="See Week 1"
          />
          <PhaseCard
            position="lg:row-start-1 lg:col-start-2 lg:mt-24"
            emoji="🎯"
            label="Month 1"
            title="Try things"
            body="Real local clubs, classes, and communities that match what you're into. Mark the ones that stick; we drop the rest."
            ctaText="See Month 1"
          />
          <PhaseCard
            position="lg:row-start-2 lg:col-span-2 lg:max-w-md lg:mx-auto lg:mt-8"
            emoji="💛"
            label="Quarter 1"
            title="Make it yours"
            body="Your keepers from Month 1 become weekly anchors. Your anchors become a routine. Your routine becomes a life that fits this place."
            ctaText="See your routine"
          />
        </div>

        {/* Hand-drawn-style annotation in the bottom-left corner */}
        <div className="hidden lg:flex absolute -bottom-4 left-2 items-center gap-3 text-orange-500 max-w-[200px]">
          <svg
            className="w-12 h-12 flex-shrink-0"
            viewBox="0 0 50 50"
            fill="none"
            aria-hidden
          >
            <circle
              cx="20"
              cy="14"
              r="5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M 12 30 Q 12 22 20 22 Q 28 22 28 30"
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 14 30 L 14 44 M 20 30 L 20 44 M 26 30 L 26 44"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle
              cx="36"
              cy="12"
              r="5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M 30 28 Q 30 20 36 20 Q 42 20 42 28"
              stroke="currentColor"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 32 28 L 32 40 M 36 28 L 36 40 M 40 28 L 40 40"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <p className="font-bold uppercase italic text-sm leading-tight -rotate-3 origin-left">
            New city,
            <br />
            made simple.
          </p>
        </div>
      </div>
    </section>
  );
}

function PhaseCard({
  position,
  emoji,
  label,
  title,
  body,
  ctaText,
}: {
  position: string;
  emoji: string;
  label: string;
  title: string;
  body: string;
  ctaText: string;
}) {
  return (
    <div
      className={`relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm ${position}`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0 leading-none" aria-hidden>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-1">
            {label}
          </p>
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] leading-relaxed">
            {body}
          </p>
          <Link
            href="/sample"
            className="mt-4 inline-block text-sm font-semibold text-[var(--accent)] hover:underline underline-offset-4"
          >
            {ctaText} →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sample task preview — keeps the tactile "what does it actually look like" moment
// ============================================================
function SamplePreview() {
  return (
    <section className="w-full max-w-4xl px-6 pb-20">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-3">
        A sample task in your plan
      </p>
      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm relative overflow-hidden">
          <div
            className="pointer-events-none absolute -top-8 -right-8 w-28 h-28 rounded-full bg-yellow-200/40"
            aria-hidden
          />
          <div className="relative flex items-start gap-3">
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
                <Line
                  label="Try"
                  value="Fleet Coffee Co · East Cesar Chavez"
                />
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
        <p className="text-sm text-[var(--muted-foreground)] max-w-[18rem] lg:pt-2">
          Your plan has ~30 of these.{" "}
          <br className="hidden lg:block" />
          Week 1 essentials, Month 1 communities to try, Quarter 1 routines to
          keep.
        </p>
      </div>
    </section>
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

// ============================================================
// Closing CTA — playful Meetup-style card with floating decorations
// ============================================================
function ClosingCTA() {
  return (
    <section className="relative w-full max-w-5xl px-6 pb-28 mt-12">
      {/* Hand-drawn annotation above the card, top-right */}
      <div
        className="hidden sm:flex absolute -top-2 right-12 lg:right-24 items-center gap-2 -rotate-6 text-orange-500 z-10"
        aria-hidden
      >
        <span className="text-2xl">★</span>
        <p className="text-xs font-bold uppercase leading-tight">
          Your new city,
          <br />
          made simple.
        </p>
      </div>

      <div className="relative rounded-3xl bg-white shadow-xl overflow-hidden py-20 sm:py-24 px-6 border border-gray-100">
        {/* Pink corner blob — top-left */}
        <div
          className="absolute -top-20 -left-16 w-56 h-56 bg-pink-300/60 rounded-full"
          aria-hidden
        />
        {/* Purple corner blob — top-right */}
        <div
          className="absolute -top-24 -right-16 w-60 h-60 bg-purple-300/50 rounded-full"
          aria-hidden
        />

        {/* Floating decorations — desktop only so mobile content stays uncrowded */}
        <div className="hidden md:block absolute inset-0 pointer-events-none">
          <FloatingPhoto
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop&auto=format&q=80"
            alt="Friends laughing"
            position="absolute left-8 lg:left-16 top-16 w-24 h-24 lg:w-28 lg:h-28"
            ringColor="ring-pink-300"
          />
          <FloatingPhoto
            src="https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=200&h=200&fit=crop&auto=format&q=80"
            alt="Group of runners"
            position="absolute right-8 lg:right-16 top-16 w-24 h-24 lg:w-28 lg:h-28"
            ringColor="ring-purple-300"
          />
          <FloatingPhoto
            src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=200&h=200&fit=crop&auto=format&q=80"
            alt="Coffee shop"
            position="absolute right-8 lg:right-24 bottom-12 w-24 h-24 lg:w-28 lg:h-28"
            ringColor="ring-emerald-300"
          />

          {/* Emoji floats */}
          <span className="absolute left-12 lg:left-28 bottom-20 text-3xl">
            📍
          </span>
          <span className="absolute right-32 lg:right-48 top-1/2 text-2xl">
            🎵
          </span>

          {/* Tiny sparkle marks */}
          <span className="absolute left-1/3 top-12 text-gray-400 text-sm">
            ✦
          </span>
          <span className="absolute right-1/3 bottom-12 text-gray-400 text-sm">
            ✦
          </span>
          <span className="absolute right-24 lg:right-40 bottom-32 text-gray-400 text-lg">
            ✦
          </span>
        </div>

        {/* Centered content */}
        <div className="relative text-center max-w-md mx-auto z-10">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
            Ready when you are.
          </h2>
          <p className="mt-4 text-base text-gray-600 leading-relaxed">
            Tell us where you&apos;re moving, when, and what you care about.
            We&apos;ll build your personalized plan in under a minute.
          </p>
          <Link
            href="/onboarding"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-gray-900 text-white px-8 text-base font-medium hover:bg-gray-800 transition shadow-sm"
          >
            Get my plan →
          </Link>
        </div>
      </div>
    </section>
  );
}

function FloatingPhoto({
  src,
  alt,
  position,
  ringColor,
}: {
  src: string;
  alt: string;
  position: string;
  ringColor: string;
}) {
  return (
    <div
      className={`${position} rounded-full overflow-hidden ring-4 ${ringColor} shadow-md bg-white`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
