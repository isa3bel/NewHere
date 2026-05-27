import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — NewHere",
};

const EFFECTIVE_DATE = "May 26, 2026";

export default function PrivacyPage() {
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
            Privacy Policy
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-2">
            NewHere Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Effective {EFFECTIVE_DATE}
          </p>
        </header>

        <Section title="Overview">
          <p>
            This Privacy Policy describes how NewHere (&ldquo;NewHere,&rdquo;
            &ldquo;we,&rdquo; or &ldquo;our&rdquo;) collects, uses, and protects
            information when you use our website and services. By accessing or
            using NewHere, you agree to the practices described in this policy.
          </p>
        </Section>

        <Section title="Information We Collect">
          <p>We collect the following categories of information:</p>
          <ul>
            <li>
              <strong>Account information.</strong> When you sign up, we collect
              your email address. We use it to authenticate your account, send
              you sign-in links, and contact you about your account.
            </li>
            <li>
              <strong>Profile information.</strong> During onboarding, you
              provide details about your move: destination city, move date,
              social preferences, budget tier, whether you have a car, your
              interests, and your goals. You can update or remove this
              information at any time.
            </li>
            <li>
              <strong>Usage information.</strong> As you use NewHere, we record
              your activity within the service — including which tasks you mark
              complete, which you save to your routine, which you dismiss, and
              the badges you earn.
            </li>
          </ul>
          <p>
            We do not collect your real name, phone number, payment information,
            precise location, contacts, photos, or data from other applications.
          </p>
        </Section>

        <Section title="How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul>
            <li>
              Generate and personalize your relocation plan based on your
              profile and activity.
            </li>
            <li>
              Authenticate you across sessions and devices via secure sign-in
              links.
            </li>
            <li>
              Maintain, improve, and develop new features of the service.
            </li>
            <li>
              Communicate with you about your account, security updates, and
              material changes to our service.
            </li>
          </ul>
          <p>
            We do not sell your information. We do not share it with advertisers
            or use it for behavioral advertising.
          </p>
        </Section>

        <Section title="Who Can Access Your Information">
          <p>
            <strong>Other users.</strong> Your data is private to your account.
            Our database enforces per-user access controls (row-level security)
            so that other users cannot view your profile, plan, or activity
            under any circumstance.
          </p>
          <p>
            <strong>NewHere personnel.</strong> Authorized members of the
            NewHere team may access user data when necessary to operate,
            support, or improve the service. Access is logged and limited to
            legitimate operational purposes.
          </p>
          <p>
            <strong>Service providers.</strong> We rely on a small number of
            vetted third parties to operate NewHere. See &ldquo;Third-Party
            Services&rdquo; below for details.
          </p>
          <p>
            <strong>Legal requests.</strong> We may disclose information when
            required by law, subpoena, or other legal process, or when we
            reasonably believe disclosure is necessary to protect our rights,
            users, or the public.
          </p>
        </Section>

        <Section title="Third-Party Services">
          <p>
            NewHere uses the following service providers, each governed by its
            own privacy policy and security standards:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> &mdash; hosts our database and provides
              authentication infrastructure.
            </li>
            <li>
              <strong>Resend</strong> &mdash; delivers transactional sign-in
              emails. Resend receives your email address but no other profile
              data.
            </li>
            <li>
              <strong>Vercel</strong> &mdash; hosts the NewHere web application
              and processes user requests.
            </li>
          </ul>
          <p>
            We require these providers to handle your information securely and
            only for the purposes described.
          </p>
        </Section>

        <Section title="Your Rights and Choices">
          <p>You have the right to:</p>
          <ul>
            <li>
              <strong>Access your data.</strong> All information you&apos;ve
              provided is visible to you in your{" "}
              <Link
                href="/profile"
                className="text-[var(--accent)] underline hover:no-underline"
              >
                profile
              </Link>{" "}
              and plan.
            </li>
            <li>
              <strong>Update your data.</strong> You can edit your profile and
              onboarding answers at any time.
            </li>
            <li>
              <strong>Delete your account.</strong> You can permanently delete
              your account and all associated data from your{" "}
              <Link
                href="/profile"
                className="text-[var(--accent)] underline hover:no-underline"
              >
                profile
              </Link>
              . Deletion is immediate and removes your profile, plan, tasks,
              and badge progress from our database.
            </li>
          </ul>
        </Section>

        <Section title="Data Retention">
          <p>
            We retain your information for as long as your account is active.
            When you delete your account, your information is removed from our
            systems promptly. We may retain limited information for a short
            period afterward where required for legal, security, or operational
            reasons.
          </p>
        </Section>

        <Section title="Data Security">
          <p>
            We use industry-standard technical and organizational measures to
            protect your information, including encryption in transit, secure
            authentication, and row-level access controls at the database
            layer. No method of transmission or storage is fully secure, but we
            take reasonable steps to safeguard your data.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            NewHere is not directed to children under 13, and we do not
            knowingly collect personal information from children. If we become
            aware that we have collected such information, we will promptly
            delete it.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices or for legal, operational, or regulatory
            reasons. When we do, we will update the effective date at the top
            of this page. If the changes are material, we will notify you
            through the service or by email.
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
