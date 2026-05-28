import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/db";

import { Sidebar } from "./Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  const onboarded = profile !== null;

  if (!onboarded) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <Sidebar />

      {/* Mobile-only top nav: shows the two app sections horizontally */}
      <div className="lg:hidden border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 flex items-center gap-4 overflow-x-auto">
        <Link href="/" className="font-semibold whitespace-nowrap">
          🌿 NewHere
        </Link>
        <span className="text-[var(--border)]">·</span>
        <Link href="/plan" className="text-sm whitespace-nowrap">
          NewHere Plan
        </Link>
        <Link href="/profile" className="text-sm whitespace-nowrap">
          Profile
        </Link>
        <Link href="/feedback" className="text-sm whitespace-nowrap">
          Feedback
        </Link>
      </div>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
