# Introduce a staging branch/environment tier between development and main

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feature` |
| **Branch** | `feat/staging-environment-tier` |
| **Depends on** | none |

---

## Problem

The current pipeline is two-tier: `main` (production, live Supabase, `USE_SEED_DATA=false`) ← `development` (integration, seeded, `USE_SEED_DATA=true`) ← `feature/*` (seeded). There is no environment where a change can be exercised against a real, non-seeded backend before it reaches production. Two concrete incidents this cycle came from that gap:

1. Waitlist-gating behavior (`account_status`) could only ever be verified against real data on `main` itself — there was no earlier real-data checkpoint.
2. PR #53 and #54 (Vercel Agent auto-PRs) targeted `main` directly and were merged there directly, because there was nowhere else "real" to send them. `development` had to be resynced afterward (PR #55) to catch back up.

---

## Background

Alex has decided to add a third tier: **`staging`**, sitting between `development` and `main`, for closed testing against a real (non-seeded) backend before anything reaches production:

```
main (production, live Supabase)
  ↑
staging (closed testing, live Supabase — separate project from production)
  ↑
development (integration, seeded)
  ↑
feature/* (seeded)
```

Key decision: **staging uses its own, separate Supabase project** — not the production database. This gives full isolation (safe to test destructively, load-test, or break things) at the cost of a second Supabase project to provision and keep schema-synced with production via the same Drizzle migrations. "Closed testing against live data" means staging exercises the real `SupabaseDataClient` code path (not seed data), gated to a small set of testers — not that it shares production's actual rows.

This handoff covers the **code and documentation** changes only. Provisioning the actual Supabase project, creating the `staging` git branch, and configuring Vercel are infrastructure actions outside what Claude Code can do from this repo — see the checklist for Alex at the end.

---

## Affected files

- Root `CLAUDE.md` — "Data & environments" section and "Git workflow" section
- `docs/ARCHITECTURE.md` §15.4 (Git workflow) and §17 (Environment Configuration)
- `apps/web/src/app/layout.tsx` — fix the `isDev` flag (see step 3 — this is a real bug the new tier would otherwise expose)
- `.env.example` — document the three environment profiles

---

## Token dependencies

None — process, docs, and one env-flag logic fix. No styling changes.

---

## Implementation steps

1. **Update root `CLAUDE.md`'s "Data & environments" section**

   Add a third bullet between the existing seeded and production bullets:

   ```markdown
   - **`staging` branch → closed testing, live backend, isolated from production.** Set `NEXT_PUBLIC_APP_ENV=staging` and `USE_SEED_DATA=false`. Connects to a **separate Supabase project** provisioned specifically for staging — same schema (kept in sync via the same Drizzle migrations applied to both projects), completely isolated data. Real auth, real Postgres, no seed data — but nothing here is production traffic or production user data. Access should be gated (Vercel Deployment Protection or equivalent) since this is closed testing, not a public preview.
   ```

   Update the existing production bullet's branch reference from "`main` → production" to clarify it now receives changes via `staging`, not directly from `development`:

   ```markdown
   - **`main` → production, live backend only.** Receives merges from `staging` only — `development` and `feature/*` branches never merge directly into `main`. `NEXT_PUBLIC_APP_ENV=production`, `USE_SEED_DATA=false`. Connects to the real, production Supabase project (auth, Postgres, Storage, Realtime) and Upstash Redis once wired.
   ```

   Commit: `docs: add staging tier to Data & environments`

2. **Update root `CLAUDE.md`'s Git workflow section**

   Replace the branch model line:

   ```markdown
   - Branch model: `main` (production) ← `development` (integration, seeded) ← `feature/<short-description>` (seeded). Each branch gets its own Vercel preview.
   ```

   With:

   ```markdown
   - Branch model: `main` (production, live) ← `staging` (closed testing, live, isolated Supabase project) ← `development` (integration, seeded) ← `feature/<short-description>` (seeded). Each branch gets its own Vercel deployment/environment.
   - `development` merges up into `staging` for a real-backend check before anything reaches production. `staging` merges up into `main` only after that check passes. Automated or bot-authored PRs (e.g. Vercel Agent integrations) that default to targeting `main` should be retargeted to `staging` before merging — do not merge them to `main` directly.
   ```

   Commit: `docs: document staging tier in git workflow`

3. **Fix the `isDev` flag so it doesn't misfire on staging**

   `apps/web/src/app/layout.tsx` currently has:

   ```ts
   const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'production'
   ```

   This renders `<DevNav />` (an internal debug navigation component) on *any* non-production environment — including the new `staging` tier, which is meant for closed external-ish testing, not internal dev tooling. Once `NEXT_PUBLIC_APP_ENV=staging` exists, this flag needs to explicitly allow-list, not deny-list:

   ```ts
   const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'development' || process.env.NEXT_PUBLIC_APP_ENV === 'preview'
   ```

   This is the same allow-list-over-deny-list principle already applied to `middleware.ts` in handoffs 021/030/035 — don't let a new, unlisted environment value silently inherit dev-only behavior.

   Commit: `fix: don't show DevNav on staging — allow-list dev environments instead of denying production`

4. **Update `docs/ARCHITECTURE.md` §15.4 (Git workflow)**

   Mirror the same branch model update made to root `CLAUDE.md` in step 2, in the "Git workflow" list under §15.4.

   Commit: `docs: mirror staging tier into ARCHITECTURE.md git workflow`

5. **Update `docs/ARCHITECTURE.md` §17 (Environment Configuration)**

   Add a `# Environment` clarifying comment above `NEXT_PUBLIC_APP_ENV` in the env var block:

   ```bash
   # App
   NEXT_PUBLIC_APP_URL=             # https://grassroots.ai in prod — see open item on domain naming
   NEXT_PUBLIC_APP_ENV=             # development | preview | staging | production
   ```

   Add a short subsection after the existing "Supabase production configuration" note explaining that `staging` requires its own complete Supabase credential set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`), scoped to the staging Vercel environment/branch, distinct from production's.

   Commit: `docs: document staging in ARCHITECTURE.md environment configuration`

6. **Update `.env.example`**

   Add a comment clarifying the three real profiles this file's variables can represent:

   ```bash
   # Data layer switch
   # Set to "true" on development/feature branches (seed data, no live services)
   # Set to "false" on staging and main (both use a real Supabase backend —
   # staging points at a separate, isolated Supabase project; main points at production)
   USE_SEED_DATA=false
   ```

   Commit: `docs: clarify staging vs production in .env.example`

---

## Verification

- [ ] Grep root `CLAUDE.md` and `docs/ARCHITECTURE.md` for "staging" — confirm both now describe the three-tier model consistently.
- [ ] `apps/web/src/app/layout.tsx`'s `isDev` no longer uses `!== 'production'` — confirm it's an explicit allow-list.
- [ ] With `NEXT_PUBLIC_APP_ENV=staging` set locally, `<DevNav />` does not render.
- [ ] With `NEXT_PUBLIC_APP_ENV=development` set locally, `<DevNav />` still renders (no regression).
- [ ] `.env.example` and both docs consistently describe `staging` as live-but-isolated, not seeded.
- [ ] `pnpm type-check` passes.

---

## Manual infrastructure checklist (Alex — not Claude Code)

None of this can be done from within the repo. Listed here for traceability, not as implementation steps:

- [ ] Create a new, separate Supabase project for staging (confirmed 2026-07-04: a fully separate project, not a Supabase persistent branch — Alex is optimizing for cost/simplicity over the auto-schema-promotion convenience branching would offer).
- [ ] Apply schema by running the three existing SQL files in `supabase/migrations/` against the new project, in order, via the Supabase SQL Editor (or `supabase db push` if the CLI is linked to it):
  1. `20260629000000_add_account_status.sql`
  2. `20260702000000_rls_policies_users_user_profiles.sql`
  3. `20260703000000_add_user_profiles_user_id_index.sql`

  **Do not use `pnpm --filter @grassroots/db db:push` (`drizzle-kit push`) as a shortcut for this.** It diffs `packages/db/src/schema.ts` against the target DB, and that file only defines tables and the `account_status` enum — it has no representation of RLS policies or the hand-written FK index. Relying on `db:push` alone would silently produce a staging database with the right tables but **no RLS policies at all**, which matters more than usual here since RLS is currently the only real enforcement layer in the app (`ARCHITECTURE.md` §8.1).
- [ ] Create the `staging` git branch off `development` on GitHub.
- [ ] In Vercel project settings, configure a branch environment for `staging` with its own `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pointing at the new staging Supabase project), `NEXT_PUBLIC_APP_ENV=staging`, `USE_SEED_DATA=false`. **`DATABASE_URL` here must be the Transaction pooler connection string, not the direct connection** — the direct connection host only resolves via IPv6, which Vercel's functions can't route, and will break every page that touches the database with an `ENOTFOUND` error (hit this exact issue setting up staging on 2026-07-04 — see handoff 042 for the full fix and corrected `.env.example`).
- [ ] Consider enabling Vercel Deployment Protection (password or SSO) on the `staging` branch's deployment — "closed testing" implies restricted access, and this is a dashboard-level toggle, not application code.
- [ ] Decide whether to add a GitHub branch protection rule requiring `main` to only accept merges from `staging` (optional hardening, not required for this handoff to be useful).
