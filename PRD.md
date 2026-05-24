# NewHere — MVP Product Requirements Document

## 1. Target User

Adults (22–40) who have recently moved (or are about to move) to a new city — domestic relocations, remote workers, recent grads, and trailing partners. They are motivated to rebuild a social life but feel overwhelmed by where to start.

Primary persona: a 28-year-old who moved for a job, knows nobody locally, and wants structure rather than an open-ended list of "things to do."

## 2. Core User Problem

Moving to a new city creates a friction-heavy gap between *intending* to build a life and *actually* showing up to recurring activities. Existing tools (Meetup, Reddit, city subreddits, Google) surface options but don't sequence them, don't account for the user's interests, and don't create accountability. Users churn before they form any routine.

NewHere solves this by turning "build a life here" into a concrete, time-boxed plan with checkable actions.

## 3. MVP Feature List

1. **Onboarding quiz** — 6–10 questions: destination city, move date, interests (multi-select from ~20 tags), social energy level (introvert/ambivert/extrovert), priorities (fitness, creative, professional, spiritual, volunteer, nightlife), constraints (budget, has car, has kids/pets).
2. **Plan generation** — produces a 7 / 30 / 90-day plan with categorized actions (Community, Hobby, Routine, Exploration). Each action has a title, short description, suggested cadence, and an external link or search query template (e.g., "search Meetup for 'bouldering' near Austin").
3. **Plan dashboard** — three tabs (Week 1, Month 1, Quarter 1) showing actions as a checklist. User can mark complete, snooze, or dismiss.
4. **Progress tracking** — visible progress bar per phase; streak counter for "weeks active."
5. **Account + persistence** — email magic-link auth via Supabase; plan saved to user account.
6. **Re-generate / edit plan** — user can update interests and regenerate, or manually add a custom action.

## 4. Out of Scope (MVP)

- Native mobile apps (web-responsive only).
- In-app messaging, friend matching, or any social graph.
- Real-time event ingestion from Meetup/Eventbrite/Partiful APIs (use static category links + search templates instead).
- Payments / subscriptions.
- Coach or human review of plans.
- Multi-city plans or "I'm visiting" mode.
- Push notifications (email reminders only, and only if trivial to add — otherwise defer).
- AI chat interface — plan generation is rules-based or single LLM call, not conversational.
- City-specific curated content beyond the top ~10 launch cities.

## 5. User Flow

1. **Landing page** → value prop, sample plan preview, "Get my plan" CTA.
2. **Onboarding quiz** (no auth required) → 6–10 screens, one question each.
3. **Plan preview** → show first few Week-1 actions blurred behind sign-up.
4. **Auth** → email magic link (Supabase).
5. **Full plan dashboard** → Week 1 tab default; user checks off first action.
6. **Return visits** → land directly on dashboard; current phase highlighted based on move date.
7. **Edit/regenerate** → settings page to update interests or move date.

## 6. Data Model

```
users (managed by Supabase Auth)
  id (uuid, pk)
  email
  created_at

profiles
  user_id (uuid, fk → users.id, pk)
  city
  move_date (date)
  social_energy (enum: low | medium | high)
  has_car (bool)
  budget_tier (enum: low | medium | high)
  interests (text[])         -- tag slugs
  priorities (text[])        -- category slugs
  updated_at

plans
  id (uuid, pk)
  user_id (uuid, fk)
  generated_at (timestamptz)
  version (int)              -- increments on regenerate
  is_active (bool)

actions
  id (uuid, pk)
  plan_id (uuid, fk)
  phase (enum: week | month | quarter)
  category (enum: community | hobby | routine | exploration)
  title (text)
  description (text)
  cadence (text)             -- e.g., "once", "weekly"
  link_url (text, nullable)
  order_index (int)

action_status
  action_id (uuid, fk, pk part)
  user_id (uuid, fk, pk part)
  state (enum: pending | done | snoozed | dismissed)
  completed_at (timestamptz, nullable)

city_content (seed data, read-only)
  city (text)
  category (text)
  template_title (text)
  template_description (text)
  link_template (text)       -- with {{interest}} placeholder
```

## 7. Recommended Tech Stack

- **Framework:** Next.js 15 (App Router, React Server Components). Server actions for mutations; route handlers only where needed.
- **Auth + DB:** Supabase — Postgres with Row Level Security policies keyed on `auth.uid()`. Magic-link email auth.
- **Styling:** Tailwind CSS v4 with a small design-token layer; shadcn/ui for primitives (Button, Card, Checkbox, Tabs, Dialog).
- **Hosting:** Vercel (preview deploys per PR, production on `main`).
- **Plan generation:** Single server action that takes the profile and produces actions. v0 = rules engine over the `city_content` table joined with the user's interests. If quality is poor, swap in one Anthropic API call (Haiku 4.5) — keep the interface identical so generation strategy is replaceable.
- **Email (reminders):** Resend, triggered by a Vercel cron daily.
- **Analytics:** PostHog (self-hosted EU or cloud) for funnel from landing → quiz → signup → first-action-checked.
- **Forms/validation:** React Hook Form + Zod (Zod schema shared between client and server actions).
- **Testing:** Playwright for the onboarding → plan-generation → check-off happy path. Skip unit tests at MVP except for the plan-generation function.

## 8. Acceptance Criteria

The MVP is shippable when all of the following are true:

1. A new visitor can complete the quiz in under 3 minutes on mobile (Lighthouse mobile score ≥ 85).
2. After quiz + sign-up, a user sees a plan with **≥ 5 actions in Week 1, ≥ 8 in Month 1, ≥ 8 in Quarter 1**, all relevant to their selected interests and city.
3. Checking off an action persists across reload and across devices.
4. RLS is enabled on every user-owned table; a verified test confirms user A cannot read user B's plan or actions.
5. The top 10 launch cities each have seed content for every interest tag (no empty plans).
6. A user can update their interests and regenerate; the new plan replaces the old as active, and history is preserved (`plans.version` increments, old `is_active = false`).
7. Magic-link auth works end-to-end on a deployed Vercel preview using a real email.
8. Funnel events fire to PostHog: `quiz_started`, `quiz_completed`, `signup_completed`, `plan_generated`, `action_completed`.
9. No personal data leaves Supabase except email (for auth) and event names (to PostHog).
10. Mean time from landing-page load to first plan render (excluding signup) is under 8 seconds on a cold Vercel deploy.
