import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Row = {
  id: string;
  user_id: string;
  surface: string;
  model: string;
  cache_hit: boolean;
  input_tokens: number;
  output_tokens: number;
  search_count: number;
  estimated_cost_cents: number;
  succeeded: boolean;
  error_message: string | null;
  created_at: string;
};

// Tiny ops dashboard for the AI layer. Pulls the last 14 days of
// ai_generations rows and shows daily totals, per-surface totals, and
// the most recent calls. Aggregation happens in JS — at MVP scale the
// row counts are small and the code is easier to read than SQL window
// functions.
//
// Numbers are cents (integer) → formatted to dollars on display.
export default async function AdminUsagePage() {
  await requireAdmin();

  const admin = createSupabaseAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 14);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await admin
    .from("ai_generations")
    .select("*")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="flex flex-col flex-1 items-center px-6 py-12">
        <div className="w-full max-w-4xl">
          <h1 className="text-2xl font-semibold">Usage</h1>
          <p className="mt-4 text-sm text-red-600">
            Failed to load usage data: {error.message}
          </p>
        </div>
      </main>
    );
  }

  const rows = (data ?? []) as Row[];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);

  const totals = {
    spendCents: rows.reduce((a, r) => a + r.estimated_cost_cents, 0),
    spendTodayCents: rows
      .filter((r) => r.created_at.slice(0, 10) === todayIso)
      .reduce((a, r) => a + r.estimated_cost_cents, 0),
    calls: rows.length,
    cacheHits: rows.filter((r) => r.cache_hit).length,
    failures: rows.filter((r) => !r.succeeded).length,
  };

  const byDay = groupByDay(rows);
  const bySurface = groupBy(rows, (r) => r.surface);
  const recent = rows.slice(0, 20);

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
            AI usage (last 14 days)
          </h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Sourced from <code>ai_generations</code>. Refresh page for fresh
            numbers.
          </p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatCard label="Spend today" value={formatCents(totals.spendTodayCents)} />
          <StatCard label="Spend (14d)" value={formatCents(totals.spendCents)} />
          <StatCard
            label="Calls (14d)"
            value={totals.calls.toLocaleString()}
            sub={`${totals.cacheHits} cache hits`}
          />
          <StatCard
            label="Failures (14d)"
            value={totals.failures.toLocaleString()}
            tone={totals.failures > 0 ? "warn" : "default"}
          />
        </section>

        <Section title="By day">
          {byDay.length === 0 ? (
            <Empty>No calls in this window.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] text-left">
                <tr>
                  <th className="py-2 pr-4">Day</th>
                  <th className="py-2 pr-4">Calls</th>
                  <th className="py-2 pr-4">Cache hits</th>
                  <th className="py-2 pr-4">Failures</th>
                  <th className="py-2 pr-4 text-right">Spend</th>
                </tr>
              </thead>
              <tbody>
                {byDay.map((d) => (
                  <tr key={d.day} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-4 font-medium tabular-nums">
                      {d.day}
                    </td>
                    <td className="py-2 pr-4 tabular-nums">{d.calls}</td>
                    <td className="py-2 pr-4 tabular-nums text-[var(--muted-foreground)]">
                      {d.cacheHits}
                    </td>
                    <td
                      className={`py-2 pr-4 tabular-nums ${
                        d.failures > 0 ? "text-red-600" : "text-[var(--muted-foreground)]"
                      }`}
                    >
                      {d.failures}
                    </td>
                    <td className="py-2 pr-4 text-right font-medium tabular-nums">
                      {formatCents(d.spendCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="By surface">
          {bySurface.length === 0 ? (
            <Empty>No calls in this window.</Empty>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-widest text-[var(--muted-foreground)] text-left">
                <tr>
                  <th className="py-2 pr-4">Surface</th>
                  <th className="py-2 pr-4">Calls</th>
                  <th className="py-2 pr-4">Cache hit rate</th>
                  <th className="py-2 pr-4 text-right">Spend</th>
                </tr>
              </thead>
              <tbody>
                {bySurface.map((s) => {
                  const rate = s.items.length
                    ? Math.round(
                        (s.items.filter((r) => r.cache_hit).length /
                          s.items.length) *
                          100,
                      )
                    : 0;
                  return (
                    <tr key={s.key} className="border-t border-[var(--border)]">
                      <td className="py-2 pr-4 font-medium">{s.key}</td>
                      <td className="py-2 pr-4 tabular-nums">{s.items.length}</td>
                      <td className="py-2 pr-4 tabular-nums">{rate}%</td>
                      <td className="py-2 pr-4 text-right font-medium tabular-nums">
                        {formatCents(
                          s.items.reduce(
                            (a, r) => a + r.estimated_cost_cents,
                            0,
                          ),
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Recent calls">
          {recent.length === 0 ? (
            <Empty>No calls yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] text-left">
                  <tr>
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Surface</th>
                    <th className="py-2 pr-3">Model</th>
                    <th className="py-2 pr-3">Cache</th>
                    <th className="py-2 pr-3 tabular-nums text-right">In</th>
                    <th className="py-2 pr-3 tabular-nums text-right">Out</th>
                    <th className="py-2 pr-3 tabular-nums text-right">Searches</th>
                    <th className="py-2 pr-3 tabular-nums text-right">Cost</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.flatMap((r) => [
                    <tr key={r.id} className="border-t border-[var(--border)]">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {formatTimestamp(r.created_at)}
                      </td>
                      <td className="py-2 pr-3 font-mono">
                        {r.user_id.slice(0, 8)}…
                      </td>
                      <td className="py-2 pr-3">{r.surface}</td>
                      <td className="py-2 pr-3 font-mono">{r.model}</td>
                      <td className="py-2 pr-3 text-[var(--muted-foreground)]">
                        {r.cache_hit ? "hit" : "miss"}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-right">
                        {r.input_tokens}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-right">
                        {r.output_tokens}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-right">
                        {r.search_count}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-right font-medium">
                        {formatCents(r.estimated_cost_cents)}
                      </td>
                      <td
                        className={`py-2 pr-3 ${
                          r.succeeded ? "text-[var(--muted-foreground)]" : "text-red-600"
                        }`}
                      >
                        {r.succeeded ? "ok" : "fail"}
                      </td>
                    </tr>,
                    !r.succeeded && r.error_message ? (
                      <tr key={`${r.id}-err`} className="border-t border-red-100 bg-red-50/50">
                        <td colSpan={10} className="py-1 px-3 text-[11px] text-red-700 font-mono whitespace-pre-wrap break-all">
                          ↳ {r.error_message}
                        </td>
                      </tr>
                    ) : null,
                  ])}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "warn";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "warn"
          ? "border-red-300 bg-red-50"
          : "border-[var(--border)] bg-[var(--card)]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
      {sub && (
        <p className="text-xs text-[var(--muted-foreground)] mt-1">{sub}</p>
      )}
    </div>
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
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
      {children}
    </div>
  );
}

function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars < 0.01 && cents > 0) return `<$0.01`;
  return `$${dollars.toFixed(2)}`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type DayBucket = {
  day: string;
  calls: number;
  cacheHits: number;
  failures: number;
  spendCents: number;
};

function groupByDay(rows: Row[]): DayBucket[] {
  const byDay = new Map<string, DayBucket>();
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    const bucket = byDay.get(day) ?? {
      day,
      calls: 0,
      cacheHits: 0,
      failures: 0,
      spendCents: 0,
    };
    bucket.calls += 1;
    if (r.cache_hit) bucket.cacheHits += 1;
    if (!r.succeeded) bucket.failures += 1;
    bucket.spendCents += r.estimated_cost_cents;
    byDay.set(day, bucket);
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
}

function groupBy<T>(rows: T[], key: (r: T) => string): { key: string; items: T[] }[] {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const arr = m.get(k) ?? [];
    arr.push(r);
    m.set(k, arr);
  }
  return [...m.entries()]
    .map(([k, items]) => ({ key: k, items }))
    .sort((a, b) => b.items.length - a.items.length);
}
