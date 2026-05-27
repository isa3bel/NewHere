# NewHere

A personalized 7/30/90-day plan for people moving to a new city — helps you find communities, hobbies, groups, and routines.

See [PRD.md](PRD.md) for the product spec and [supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql) for the data model.

## Stack

- Next.js 15 (App Router, TypeScript, Turbopack)
- Tailwind CSS v4
- Supabase (Postgres + Auth) — *not yet wired up; UI runs on mock data*
- Vercel (deploy target)

## Run locally

```
npm install
npm run dev
```

Open http://localhost:3000.

## Project structure

```
app/                  Next.js pages and layouts
  page.tsx            Landing
  onboarding/         Quiz flow
  plan/               7/30/90-day plan dashboard
lib/
  types.ts            Shared TypeScript types
  mock-data.ts        Hardcoded sample data
  db.ts               Data access layer (calls mock today; swap to Supabase later)
  auth.ts             Fake user context (swap to Supabase Auth later)
supabase/migrations/  SQL schema (apply via Supabase SQL editor when backend is ready)
```

## Swapping in Supabase later

Every component reads/writes through `lib/db.ts` and `lib/auth.ts`. When Supabase is provisioned, replace the function bodies in those two files — page and component code does not change.
