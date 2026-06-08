"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Floating circular feedback button — fixed to the top-right corner of
// every page, visible to signed-in and signed-out visitors alike. Links
// to /feedback (the public form) so anyone can flag a bug or share an
// idea with one tap.
//
// Hidden on /feedback itself (the user is already there) and on admin
// routes (admins reading the inbox don't need to send themselves
// feedback).
export function FloatingFeedbackButton() {
  const pathname = usePathname();

  if (pathname === "/feedback" || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <Link
      href="/feedback"
      aria-label="Send feedback"
      title="Send feedback"
      className="fixed top-4 right-4 z-40 h-12 w-12 rounded-full bg-transparent border-2 border-[var(--accent)] text-[var(--accent)] shadow-md hover:scale-110 hover:bg-[var(--accent)]/10 hover:shadow-lg active:scale-95 transition-all duration-150 flex items-center justify-center backdrop-blur-sm"
    >
      <span className="text-xl leading-none" aria-hidden>
        🐞
      </span>
    </Link>
  );
}
