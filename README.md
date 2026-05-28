# NewHere

A personalized 7/30/90-day plan for people moving to a new city. Generates city-specific suggestions for communities, hobbies, errands, and routines using Claude + web search.

See [PRD.md](PRD.md) for product spec.

## Stack

- **Next.js 16** (App Router, TypeScript) — read `node_modules/next/dist/docs/` before assuming API shape
- **Tailwind CSS v4**
- **Supabase** — Postgres + Auth (magic-link via Resend SMTP) + Row Level Security
- **Anthropic Claude API** (Haiku 4.5) with `web_search_20250305` tool for city-specific personalization
- **Vercel** — production deploy + Web Analytics
- **Custom email** via Resend (bypasses Supabase's built-in rate limit)

## What's live

| Surface | Status |
|---|---|
| Onboarding (city, neighborhood, interests, goals, social style, budget) | ✓ |
| Magic-link sign-in | ✓ |
| Pre-move suggestions | ✓ AI-personalized (real Claude + web search) |
| Week 1 "Land & settle" essentials | ✓ AI overlay (titles + detailed how-to guide per slot) |
| Month 1 "Try things" | Static for now — reads from `mockTasks` |
| Quarter 1 "Your routine" | Derived from kept anchors (no AI call) |
| Sample page (public, no auth) | Hand-written Austin overlay that mimics AI output |
| User feedback form (`/feedback`) | ✓ |
| Admin dashboards (`/admin/usage`, `/admin/feedback`) | ✓ |

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin client (writes badges, runs admin pages) |
| `USE_FAKE_AI` | `true` = mock mode (no API calls, $0). Defaults to `true` if unset. |
| `ANTHROPIC_API_KEY` | Required when `USE_FAKE_AI=false` |
| `ADMIN_EMAILS` | Comma-separated emails. Gates `/admin/*` + grants higher AI rate limit |

## Database setup

Migrations live in [supabase/migrations/](supabase/migrations/). Run each once in the Supabase SQL editor in order:

- `0001_initial_schema.sql` — profiles, plans, tasks, badges, user_badges + RLS + grants
- `0002_ai_scaffolding.sql` — AI cache (`ai_suggestions`) + audit log (`ai_generations`)
- `0003_add_neighborhood.sql` — optional neighborhood field on profile
- `0004_task_details.sql` — `details_json` on tasks (used to persist pre-move item content)
- `0005_feedback.sql` — feedback table + RLS

## Architecture notes

### AI generation

- Two AI-backed surfaces today: `pre_move` and `week_one`. Generation logic in [lib/ai/](lib/ai/).
- **Each generation = one Claude call** with `web_search_20250305` tool. The model searches the city's transit system, utilities, library, DMV, etc., then returns a JSON code-fenced response that's validated and stored.
- Output is cached in `ai_suggestions` keyed by `(user_id, surface, profile_hash)`. The fingerprint is a SHA-256 of profile inputs that affect output (city, neighborhood, interests, goals, social style, budget). Same fingerprint → cache hit, $0.
- A "↻ Refresh" button on `/plan` invalidates the cache and forces a regeneration.
- Failures (Anthropic errors, invalid JSON, rate limit) log to `ai_generations` and trigger a yellow banner on `/plan` with "Try again" / "Use generic plan" affordances.
- Real-AI page-load latency: 15–30 seconds on cache miss. A [loading.tsx](app/(app)/plan/loading.tsx) skeleton covers the wait.

### Cost protections

Three layers, defense in depth:

1. **Anthropic console spend cap** — hard ceiling, returns errors when hit
2. **Per-user daily generation limit** — 5/day for regular users, 50/day for admins (`ADMIN_EMAILS`). See [lib/ai/config.ts](lib/ai/config.ts).
3. **`USE_FAKE_AI=true`** kill switch — full mock mode, zero API calls

Every call (including cache hits) records a row in `ai_generations` with token counts + estimated cents. View at `/admin/usage`.

### Vercel function timeout

`/plan` has `export const maxDuration = 60` because real-AI calls regularly exceed the 10s Hobby default. Surfaces run in parallel (`Promise.all`) so total time is `max(pre_move, week_one)`, not their sum.

### Auth + access control

- Magic-link via Supabase Auth, custom Resend SMTP to avoid built-in throttling
- Middleware ([lib/supabase/middleware.ts](lib/supabase/middleware.ts)) redirects unauth users from `/plan`, `/profile`, `/onboarding`, `/feedback`, `/admin` to `/sign-in`
- Admin pages additionally check `ADMIN_EMAILS` via `requireAdmin()` and 404 for non-admins

## Project structure

```
app/
  (app)/                 Authed routes (sidebar layout)
    plan/                Main dashboard — Week 1 / Month 1 / Quarter 1
    profile/             Edit onboarding answers + delete account
    feedback/            User feedback form
  admin/
    usage/               AI generation log + cost dashboard
    feedback/            Inbox for user-submitted feedback
  onboarding/            First-run quiz
  sample/                Public Austin sample (no auth)
  sign-in/               Magic link
  privacy/               Privacy policy
  actions.ts             All server actions
  layout.tsx             Root layout + Analytics

lib/
  ai/                    AI cache + generation + sanitization
    config.ts            USE_FAKE_AI, model, token prices, rate limits
    generate-pre-move.ts
    generate-week-one.ts
    cache.ts             Read / write / invalidate ai_suggestions
    usage-log.ts         Daily limit + audit log
    fingerprint.ts       Cache key derivation
    sanitize.ts          Strip web_search citation tags + dedup
    types.ts             AiSuggestion, AiWeekOneDetail, SurfaceResult
  supabase/              SSR + browser + admin clients + middleware
  types.ts               Profile, Task, Plan, Badge, KeeperState, ...
  db.ts                  Supabase data access (Profile / Plan / Task / Badge CRUD)
  auth.ts                requireUser, requireAdmin, sign-in helpers
  task-guides.ts         Static Week 1 guides — AI overlay overrides per task
  for-you-data.ts        Curated pre-move catalog (fallback for mock mode)
  mock-data.ts           Starter 28 tasks copied into every new user's plan
  plan-progress.ts       Day math + phase status + "today's focus" selection
  routine-slots.ts       Anchor → weekly time-slot mapping for Quarter 1

supabase/migrations/     Run in order, see Database setup
```

## Deploy

Production runs on Vercel. Pushes to `main` trigger an automatic deploy via the Vercel GitHub App webhook.

### Vercel env vars

Set these in Vercel → Settings → Environment Variables, scoped to Production (and Preview where relevant):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — same as local
- `USE_FAKE_AI=false` on Production; leave unset on Preview (defaults to mock so PRs are free)
- `ANTHROPIC_API_KEY` on Production + Preview
- `ADMIN_EMAILS` on all environments

### Migrations

Prod and dev share the same Supabase project. Migrations run once in the SQL editor and apply to both. The pre-launch "drop tables" reset block has been removed from `0001` — additive migrations only from here on.
