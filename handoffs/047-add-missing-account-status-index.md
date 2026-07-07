# Add missing index on `users.account_status`

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `fix` |
| **Branch** | `fix/users-account-status-index` |
| **Depends on** | none |

---

## Problem

`docs/ARCHITECTURE.md` §6.3 states: "Every column used in a `WHERE` clause that is not a primary key must have an index." `users.account_status` has been filtered on directly since it was introduced (handoff 012) — `SupabaseDataClient.getWaitlistCount()` (`apps/web/src/lib/data/supabase-client.ts`) runs `SELECT count(*) FROM users WHERE account_status = 'waitlisted'` — but no index on that column exists anywhere in `supabase/migrations/`.

Confirmed by reading every migration file directly: across all four files in `supabase/migrations/`, the only `CREATE INDEX` statement in the repo's history is `idx_user_profiles_user_id` (handoff 032). `account_status` has never been indexed.

---

## Background

This query isn't occasional — the landing page (`apps/web/src/app/(auth)/page.tsx`) calls `getWaitlistCount()` on every request (the route is explicitly `force-dynamic`, so this isn't cached at the Next.js layer either). Every anonymous visit to `/` performs a sequential scan of `users` filtered by `account_status` today. At current row counts this costs nothing measurable, but it's the same "cheap now, expensive to discover as a slow-query incident later" reasoning handoff 032 used for the `user_profiles.user_id` FK index — and that precedent is the model for this fix: a single idempotent `CREATE INDEX IF NOT EXISTS`, no schema.ts change (this codebase manages indexes only via raw migration SQL, not Drizzle schema annotations — consistent with handoff 032).

I can't confirm from the repo alone whether this index already exists on any live database (the same caveat handoff 032 noted for `user_profiles` — baseline table creation for `users` predates this repo's migration history). `CREATE INDEX IF NOT EXISTS` makes that ambiguity safe either way.

---

## Affected files

- `supabase/migrations/<today's date, YYYYMMDDHHMMSS pattern>_add_users_account_status_index.sql` — new migration

---

## Token dependencies

None — database only.

---

## Implementation steps

1. **Add the index migration**

   ```sql
   -- Migration: add missing index on users.account_status
   -- Handoff 047 — ARCHITECTURE.md §6.3 requires an index on every column used
   -- in a WHERE clause. account_status has been queried directly (e.g.
   -- getWaitlistCount()) since handoff 012 but was never indexed.
   -- Idempotent: safe to rerun regardless of current live state, which cannot
   -- be confirmed from the migration history alone (see handoff 032 for the
   -- same caveat on users/user_profiles' baseline schema).

   CREATE INDEX IF NOT EXISTS idx_users_account_status
     ON users (account_status);
   ```

   Naming follows `docs/ARCHITECTURE.md` §5.1: `idx_{table}_{column}`.

   Apply this migration to whichever environment(s) currently have a live, non-seeded Supabase backend (production at minimum), and note in your handoff completion which environment(s) you've applied it to — same expectation as handoff 044.

   Commit: `fix: add missing index on users.account_status`

---

## Verification

- [ ] Running the migration against the live database succeeds (whether or not the index already existed).
- [ ] Running it a second time produces no error.
- [ ] `\d users` in `psql` (or the equivalent Supabase Studio view) shows `idx_users_account_status` on `account_status`.
- [ ] `pnpm type-check` passes (no code changes, but keep the habit).
