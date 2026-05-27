"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/plan", label: "NewHere Plan", icon: "📋" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block lg:w-60 lg:flex-shrink-0 lg:border-r lg:border-[var(--border)] lg:bg-[var(--card)] lg:h-screen lg:sticky lg:top-0">
      <div className="flex h-full flex-col">
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-6 text-lg font-semibold"
        >
          <span className="text-2xl" aria-hidden>🌿</span>
          <span>NewHere</span>
        </Link>

        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                        : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <span aria-hidden>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-6 py-4 text-xs text-[var(--muted-foreground)]">
          Demo build · v0.1
        </div>
      </div>
    </aside>
  );
}
