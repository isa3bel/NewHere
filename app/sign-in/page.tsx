import Link from "next/link";

import { SignInForm } from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/plan";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-8 relative">
      <Link
        href="/"
        className="absolute top-6 left-6 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
      >
        ← Back
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)] mb-2">
            NewHere
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Sign in to your plan
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            We&apos;ll email you a one-tap link. No password needed.
          </p>
        </div>
        <SignInForm next={next} />
        <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
          By signing in, you agree to our{" "}
          <Link href="/privacy" className="underline hover:text-[var(--foreground)]">
            privacy practices
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
