import Link from "next/link";

import { LocalTime } from "@/app/admin/usage/LocalTime";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

// Read-only list of user-submitted feedback. Service-role client so we
// see every row regardless of submitter. Status updates aren't editable
// from this page yet — do them via Supabase SQL editor when needed
// (e.g. `update feedback set status = 'resolved' where id = ...`).
export default async function AdminFeedbackPage() {
  await requireAdmin();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];

  const counts = {
    total: rows.length,
    new: rows.filter((r) => r.status === "new").length,
    bug: rows.filter((r) => r.category === "bug").length,
    suggestion: rows.filter((r) => r.category === "suggestion").length,
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
            Latest 200 submissions, newest first. Update status via SQL
            (<code>update feedback set status = &apos;...&apos;</code>).
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            Failed to load: {error.message}
          </div>
        )}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatCard label="Total" value={counts.total.toString()} />
          <StatCard
            label="New"
            value={counts.new.toString()}
            tone={counts.new > 0 ? "accent" : "default"}
          />
          <StatCard label="Bugs" value={counts.bug.toString()} />
          <StatCard label="Suggestions" value={counts.suggestion.toString()} />
        </section>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted-foreground)]">
            No feedback yet.
          </div>
        ) : (
          <ul className="space-y-4">
            {rows.map((r) => {
              const cat = CATEGORY_STYLES[r.category];
              return (
                <li
                  key={r.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5"
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
                    <span className="text-xs text-[var(--muted-foreground)] ml-auto">
                      <LocalTime iso={r.created_at} />
                    </span>
                  </div>

                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {r.message}
                  </p>

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
            })}
          </ul>
        )}
      </div>
    </main>
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
