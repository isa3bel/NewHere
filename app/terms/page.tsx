import Link from "next/link";

export const metadata = {
  title: "Terms of Service — NewHere",
};

const EFFECTIVE_DATE = "June 6, 2026";

export default function TermsPage() {
  return (
    <main className="flex flex-col flex-1 items-center">
      <article className="w-full max-w-2xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-[var(--muted-foreground)] hover:underline"
        >
          ← Home
        </Link>

        <header className="mt-6 mb-10">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Terms of Service
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">
            NewHere Terms of Service
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Effective {EFFECTIVE_DATE}
          </p>
        </header>

        <Section title="Acceptance">
          <p>
            By using NewHere (&ldquo;NewHere,&rdquo; &ldquo;we,&rdquo;
            &ldquo;our&rdquo;), you agree to these Terms of Service. If you do
            not agree, please do not use the service.
          </p>
        </Section>

        <Section title="The Service">
          <p>
            NewHere generates personalized 7/30/90-day plans for people moving
            to a new city. The plan includes suggested tasks, local
            communities, and routines based on your stated city, interests,
            goals, and other onboarding answers. Suggestions are generated
            by AI and may include real local organizations and events sourced
            from the public web.
          </p>
          <p>
            <strong>This is currently a private beta.</strong> Features may
            change without notice, content may be incomplete or inaccurate,
            and the service may be unavailable from time to time.
          </p>
        </Section>

        <Section title="Your Account">
          <p>
            You sign in with a magic link sent to your email address. You are
            responsible for maintaining the security of the email account
            associated with NewHere. You may delete your account and all
            associated data at any time from your{" "}
            <Link
              href="/profile"
              className="text-[var(--accent)] underline hover:no-underline"
            >
              profile
            </Link>
            .
          </p>
          <p>
            You must be at least 13 years old to use NewHere.
          </p>
        </Section>

        <Section title="Acceptable Use">
          <p>You agree not to:</p>
          <ul>
            <li>
              Use the service for any unlawful purpose or in violation of
              applicable law.
            </li>
            <li>
              Attempt to access another user&apos;s account or data, or
              circumvent the service&apos;s security controls.
            </li>
            <li>
              Probe, scan, or test the vulnerability of the service without
              prior written permission.
            </li>
            <li>
              Use automated means to scrape, crawl, or extract data from the
              service.
            </li>
            <li>
              Submit content that is unlawful, infringing, threatening,
              defamatory, or otherwise objectionable.
            </li>
          </ul>
        </Section>

        <Section title="AI-Generated Content">
          <p>
            NewHere uses large language models and web search to generate
            recommendations. AI output is best-effort and may be inaccurate,
            out of date, or incomplete. Always verify important details
            (hours, prices, locations) before acting on a suggestion. NewHere
            is not responsible for outcomes resulting from third-party events,
            organizations, or services we surface.
          </p>
        </Section>

        <Section title="Third-Party Services">
          <p>
            Tasks and suggestions may link to third-party websites,
            organizations, and services. NewHere does not control and is not
            responsible for the availability, content, or practices of those
            third parties. Your use of any third-party service is governed by
            that party&apos;s own terms.
          </p>
        </Section>

        <Section title="Your Content">
          <p>
            You retain ownership of the information you provide (city,
            interests, goals, custom anchors, feedback). You grant NewHere
            permission to store, process, and display this information to
            provide the service to you.
          </p>
        </Section>

        <Section title="Beta Disclaimer">
          <p>
            NewHere is currently a private beta and is provided
            &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, whether express or implied, including but
            not limited to merchantability, fitness for a particular purpose,
            and non-infringement. We do not warrant that the service will be
            uninterrupted, secure, or error-free.
          </p>
        </Section>

        <Section title="Limitation of Liability">
          <p>
            To the maximum extent permitted by law, NewHere will not be liable
            for any indirect, incidental, consequential, or punitive damages
            arising out of or related to your use of the service. Our total
            liability for any claim relating to the service is limited to one
            hundred US dollars ($100) in the aggregate.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            We may suspend or terminate your access to NewHere at any time,
            with or without cause, including for violation of these terms.
            You may stop using the service and delete your account at any
            time.
          </p>
        </Section>

        <Section title="Changes to These Terms">
          <p>
            We may update these terms from time to time. When we do, we will
            update the effective date at the top of this page. If the changes
            are material, we will notify you through the service or by email.
            Your continued use of NewHere after the changes take effect
            constitutes acceptance of the updated terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms? Send feedback through the{" "}
            <Link
              href="/feedback"
              className="text-[var(--accent)] underline hover:no-underline"
            >
              feedback form
            </Link>{" "}
            once you&apos;re signed in.
          </p>
        </Section>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:my-3 [&_strong]:font-medium [&_strong]:text-[var(--foreground)] text-[var(--foreground)]">
        {children}
      </div>
    </section>
  );
}
