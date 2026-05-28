import Link from "next/link";

import { setFeedbackStatusAction } from "@/app/actions";
import { LocalTime } from "@/app/admin/usage/LocalTime";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const CATEGORIES = ["bug", "suggestion", "general"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

function parseCategoryFilter(value: string | undefined): CategoryFilter | null {
  if (!value) return null;
  return (CATEGORIES as readonly string[]).includes(value)
    ? (value as CategoryFilter)
    : null;
}

type Row = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  category: "bug" | "suggestion" | "general";
  message: string;
  context: string | null;
  status: "new" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
};

const CATEGORY_STYLES: Record<Row["category"], { label: string; className: string }> = {
  bug: { label: "🐞 Bug", className: "bg-red-100 text-red-800" },
  suggestion: { label: "💡 Suggestion", className: "bg-amber-100 text-amber-800" },
  general: { label: "💬 General", className: "bg-slate-100 text-slate-800" },
};

const STATUS_STYLES: Record<Row["status"], string> = {
  new: "bg-[var(--accent)]/15 text-[var(--accent)]",
  reviewing: "bg-blue-100 text-blue-800",
  resolved: "bg-emerald-100 text-emerald-800",
  dismissed: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};

// Read-only-ish list of user-submitted feedback. Service-role client
// so we see every row regardless of submitter. "Mark resolved" /
// "Reopen" buttons inline; richer status changes (reviewing / dismissed)
// still done via SQL.
export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireAdmin();
  const { category: categoryParam } = await searchParams;
  const categoryFilter = parseCategoryFilter(categoryParam);

  const admin = createSupabaseAdminClient();
  // Fetch ALL rows (up to 200) so the filter pill counts are accurate
  // even when a category is selected. Filter in-memory below.
  const { data, error } = await admin
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const allRows = (data ?? []) as Row[];
  const rows = categoryFilter
    ? allRows.filter((r) => r.category === categoryFilter)
    : allRows;

  const counts = {
    total: allRows.length,
    new: allRows.filter((r) => r.status === "new").length,
    bug: allRows.filter((r) => r.category === "bug").length,
    suggestion: allRows.filter((r) => r.category === "suggestion").length,
    general: allRows.filter((r) => r.category === "general").length,
  };

  return (
    <main className="flex flex-col flex-1 items-center px-6 py-12">
      <div className="w-full max-w-5xl">
        <Link
          href="/plan"
          className="text-sm text-[var(--muted-foreground)] hover:underline"
        >
          ← Back
        </Link>

        <header className="mt-6 mb-8">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
            Admin
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">
            Feedback inbox
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Latest 200 submissions, newest first. Click a row&apos;s status
            button to mark it resolved or reopen it.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            Failed to load: {error.message}
          </div>
        )}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={counts.total.toString()} />
          <StatCard
            label="New"
            value={counts.new.toString()}
            tone={counts.new > 0 ? "accent" : "default"}
          />
          <StatCard label="Bugs" value={counts.bug.toString()} />
          <StatCard label="Suggestions" value={counts.suggestion.toString()} />
        </section>

        <nav
          aria-label="Filter by category"
          className="flex flex-wrap gap-2 mb-6"
        >
          <FilterPill
            href="/admin/feedback"
            label="All"
            count={counts.total}
            active={categoryFilter === null}
          />
          <FilterPill
            href="/admin/feedback?category=bug"
            label="🐞 Bugs"
            count={counts.bug}
            active={categoryFilter === "bug"}
          />
          <FilterPill
            href="/admin/feedback?category=suggestion"
            label="💡 Suggestions"
            count={counts.suggestion}
            active={categoryFilter === "suggestion"}
          />
          <FilterPill
            href="/admin/feedback?category=general"
            label="💬 General"
            count={counts.general}
            active={categoryFilter === "general"}
          />
        </nav>

        <FeedbackList
          activeRows={rows.filter((r) => r.status !== "resolved")}
          resolvedRows={rows.filter((r) => r.status === "resolved")}
        />
      </div>
    </main>
  );
}

// Renders active items normally, then tucks resolved items into a
// native <details> element so they don't crowd the workspace. Native
// disclosure means no client component needed — semantics for free.
function FeedbackList({
  activeRows,
  resolvedRows,
}: {
  activeRows: Row[];
  resolvedRows: Row[];
}) {
  if (activeRows.length === 0 && resolvedRows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted-foreground)]">
        No feedback yet.
      </div>
    );
  }

  return (
    <>
      {activeRows.length > 0 ? (
        <ul className="space-y-4">
          {activeRows.map((r) => (
            <FeedbackRow key={r.id} row={r} />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
          No active items — everything matching this filter is resolved.
        </div>
      )}

      {resolvedRows.length > 0 && (
        <details className="mt-8 group">
          <summary className="cursor-pointer list-none inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
            <span className="transition-transform group-open:rotate-90">▸</span>
            <span>
              Resolved ({resolvedRows.length})
            </span>
          </summary>
          <ul className="mt-4 space-y-4">
            {resolvedRows.map((r) => (
              <FeedbackRow key={r.id} row={r} dim />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function FeedbackRow({ row: r, dim }: { row: Row; dim?: boolean }) {
  const cat = CATEGORY_STYLES[r.category];
  return (
    <li
      className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 ${
        dim ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.className}`}
        >
          {cat.label}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[r.status]}`}
        >
          {r.status}
        </span>
        <form action={setFeedbackStatusAction}>
          <input type="hidden" name="id" value={r.id} />
          <input
            type="hidden"
            name="nextStatus"
            value={r.status === "resolved" ? "new" : "resolved"}
          />
          <button
            type="submit"
            className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
          >
            {r.status === "resolved" ? "↩ Reopen" : "✓ Mark resolved"}
          </button>
        </form>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">
          <LocalTime iso={r.created_at} />
        </span>
      </div>

      <p className="text-sm whitespace-pre-wrap leading-relaxed">{r.message}</p>

      {r.context && (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          <span className="font-semibold uppercase tracking-widest mr-1">
            Where:
          </span>
          {r.context}
        </p>
      )}

      <p className="mt-3 text-xs text-[var(--muted-foreground)] font-mono">
        {r.user_email ?? "(deleted user)"}
        {r.user_id && (
          <span className="ml-2 opacity-70">
            · {r.user_id.slice(0, 8)}…
          </span>
        )}
      </p>
    </li>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "accent"
          ? "border-[var(--accent)] bg-[var(--accent)]/5"
          : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
        {label}
      </p>
      <p
        className={`text-2xl font-semibold mt-1 tabular-nums ${
          tone === "accent" ? "text-[var(--accent)]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FilterPill({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
          : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      }`}
    >
      <span>{label}</span>
      <span
        className={`tabular-nums ${
          active ? "opacity-80" : "text-[var(--muted-foreground)]"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
