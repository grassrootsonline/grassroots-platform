# Vercel Platform — Best Practices & Recommendations

> Companion to `docs/ARCHITECTURE.md` (which defines *what we've built and decided*). This document is about the platform we deploy on: what Vercel actually does today, what we're already doing right, and where we have real, actionable room to improve. Written for engineering and product/project planning alike — the "why it matters" is spelled out for each item, not just the mechanics.

---

## 1. What's already working well

Worth stating plainly before the recommendations, so this doesn't read as "everything is wrong":

- **Deployment model** — every push to any branch gets its own Vercel preview deployment automatically via Git integration (`docs/ARCHITECTURE.md` §15.4). No custom CI/CD pipeline needed for this; Vercel's Git integration already does the right thing for our branch-per-environment model (`main` / `staging` / `development` / `feature/*`).
- **Data-fetching pattern** — `(platform)/layout.tsx`, `feed/page.tsx`, and `admin/page.tsx` already fetch their independent queries with `Promise.all` rather than sequential `await`s. This is exactly Vercel/Next.js's recommended pattern for avoiding request waterfalls — the DB timeout issue in handoffs 063/064 was a connection-pool sizing problem, not a data-fetching-pattern problem.
- **Images** — `next.config.ts` already scopes `remotePatterns` to Supabase Storage. Once real avatar/project images are wired up, using `next/image` (not `<img>`) is already the correct default to reach for.
- **Observability basics** — Vercel Speed Insights and Analytics are both wired in (`apps/web/src/app/layout.tsx`), giving Core Web Vitals and usage data with zero extra infrastructure.
- **Explicit `maxDuration`** — handoff 064 added `maxDuration = 30` to the admin and platform layouts. This is good practice independent of why it was added: it means a stuck request fails fast and visibly instead of silently holding a database connection.

---

## 2. Functions & timeouts — one correction to our own assumption

Vercel's default function timeout changed platform-wide: **all plans (including Hobby) now default to 300 seconds** under Fluid Compute, up from the old 60–90s. The "Task timed out after 300 seconds" error in handoff 064 was hitting that new, higher default — not a Hobby-plan 60s ceiling as older Vercel docs (and most LLM training data) would suggest.

**Why this matters going forward:** 300s is a long time for a request to hold open a database connection before Vercel kills it. The `maxDuration = 30` override on the admin/platform layouts is the right instinct — it turns "hangs for 5 minutes, exhausting a connection the whole time" into "fails after 30 seconds, connection freed." As new routes get added, especially anything doing DB or third-party API work, **default to setting an explicit `maxDuration` rather than trusting the 300s platform default** — pick a number based on what a legitimate request should actually take, the same way 30s was chosen here (generous for current data volume, short enough to fail visibly).

Also worth knowing: **Fluid Compute reuses warm function instances across concurrent requests** rather than spinning up one instance per request. This is *why* handoff 063/064's connection-pool math worked the way it did — a low per-instance `max` on `postgres.js` caps how many DB connections one warm instance can hold even while serving several requests, which is a more accurate mental model than "one function invocation = one instance."

---

## 3. Environment variables — a likely fix for the staging blocker

`docs/ARCHITECTURE.md`'s environment callout says staging has been non-operational since 2026-07-04 because "Vercel↔Supabase environment variable wiring isn't working end-to-end." There's a concrete Vercel feature that directly addresses this and is worth trying before further diagnosis:

**Preview environment variables can be scoped to a specific Git branch.** Instead of one shared set of "Preview" env vars covering every `feature/*` branch and `staging` alike, `staging` can get its own `DATABASE_URL` (and other secrets) that no other preview deployment sees:

```bash
vercel env add DATABASE_URL preview --git-branch=staging
vercel env add SUPABASE_SERVICE_ROLE_KEY preview --git-branch=staging
```

This matters because `staging` needs real Supabase credentials (its own isolated project, per `CLAUDE.md`'s data-environment rules) while every other `feature/*`/`development` preview deployment should stay on seed data and needs no real credentials at all. If the current setup has one set of "Preview"-scoped variables trying to serve both cases, that's a plausible source of the wiring failures — a `staging`-only DB credential removes the ambiguity entirely rather than requiring `USE_SEED_DATA` logic to also gate which credentials load.

**General env var hygiene worth adopting team-wide:**
- Vars prefixed `NEXT_PUBLIC_` are bundled into client-side JS — never put a secret there. Worth an explicit check whenever adding a new env var: does anything client-side need to read this, or is it server-only?
- `vercel env pull .env.local` **overwrites the whole file** — any hand-added local-only vars get wiped. If anyone's added ad hoc local overrides, keep them in `.env.development.local` instead (Next.js loads it after `.env.local`, and it's outside what `pull` touches).
- Commit a `.env.example` with empty values so a new contributor (or a fresh Claude Code session on a new machine) knows what variables exist without needing dashboard access.

---

## 4. Database connections — the durable fix is upstream of the app

Handoffs 063 and 064 were both `postgres.js`'s `max` setting — first dropped to 1 to stop `EMAXCONNSESSION`, then raised to 3 once it became clear `max: 1` was serializing every request's internal `Promise.all` fan-out onto one connection, at times long enough to hit the function timeout. Both fixes were correct, but both were tuning the *symptom's* dial.

The comment already in `packages/db/src/index.ts` states the real mechanism accurately: the **Supabase transaction pooler**, not this app's `max`, is what bounds real backend-connection usage across all instances. That means the actual lever for "how much concurrency can this app sustain" is the pooler's configured `pool_size` in Supabase, not this file. Two concrete recommendations:

- Before raising `max` again, check the pooler's `pool_size` via Supabase directly (there's already Supabase MCP tooling available for this) — raising the app-level `max` without knowing the pooler's real ceiling is guessing.
- If/when traffic grows past "2 real users," this is worth revisiting with actual numbers rather than another reactive round of trial-and-error tuning under production error pressure, the way 063→064 played out.

---

## 5. Rendering & caching — the next lever, if pages start feeling slow

Nothing needs to change today (traffic is minimal), but worth having in the back pocket for the project manager's planning: the `Promise.all` pattern in `admin/page.tsx` and `feed/page.tsx` blocks the *entire* page behind the slowest of its parallel queries. Next.js's `<Suspense>` boundaries let independent sections stream in as their own data resolves, instead of the whole page waiting on all four `feed/page.tsx` queries together. This is a UX/perceived-performance lever, not a correctness fix — reach for it when a page's total load time starts to matter more than it does now, not preemptively.

Separately: `revalidateTag()` is already the documented mutation-invalidation pattern (`docs/ARCHITECTURE.md` §9.3). No ISR or full-page caching is in use yet, which is appropriate — there's no meaningful cached-content story until posts/feed actually have real data volume (`ROADMAP.md`).

---

## 6. Config format — not urgent, but worth knowing about

`apps/web/vercel.json` today is a simple 4-line static config (framework, install/build commands, output directory). Vercel's now-recommended config format is **`vercel.ts`** — a typed TypeScript config (via `@vercel/config`) that supports dynamic logic and reading environment variables at config-build time, where `vercel.json` only supports static JSON. Not worth migrating for a 4-line file today, but if cron jobs, custom rewrites/redirects, or per-environment build logic get added later, `vercel.ts` is the more capable and more maintainable place to add them versus growing `vercel.json` in place.

---

## 7. Observability — one team-relevant tool worth trying

`ROADMAP.md` already tracks that Sentry/Axiom aren't wired yet. Separately, and available today at no setup cost: **Vercel Agent** (public beta) does AI-assisted PR code review and production incident investigation directly against a Vercel project. Given this is a small team relying on manual review of Vercel previews before merging (`CLAUDE.md`'s git workflow), it's worth a trial run — it's a low-effort way to get a second reviewer on every PR without changing the review process itself.

---

## 8. Monorepo builds — a lever for later, not now

The build command (`turbo build --filter=@grassroots/web`) already uses Turborepo's task filtering, which is the right foundation. As more packages get added under `packages/*`, Turborepo's **remote caching** (sharing build/type-check cache across CI runs and contributors, not just locally) becomes worth enabling — it turns "rebuild everything on every push" into "only rebuild what actually changed since the last cached build," which compounds as the monorepo grows. Not worth setting up for the current package count, but worth revisiting if build times start becoming noticeable.

---

## Summary for planning purposes

| Area | Status | Action |
|---|---|---|
| Deployment model | Working well | None |
| Data-fetching pattern | Working well | None |
| Function timeouts | Corrected understanding | Default new routes to an explicit `maxDuration` |
| Staging env vars | Likely root cause identified | Try Git-branch-scoped Preview env vars for `staging` |
| DB connection tuning | Symptom fixed twice | Next tuning pass should start from Supabase pooler config, not app `max` |
| Rendering/caching | Appropriate for current scale | Revisit Suspense streaming if page load time becomes a real complaint |
| Config format | Non-issue today | Know `vercel.ts` exists for when config logic grows |
| Observability | Partially wired | Trial Vercel Agent for PR review |
| Monorepo build caching | Non-issue today | Revisit Turborepo remote cache as packages grow |
