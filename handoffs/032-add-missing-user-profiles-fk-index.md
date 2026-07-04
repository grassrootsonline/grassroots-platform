# Add missing FK index on `user_profiles.user_id`, flag schema baseline gap

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `fix` |
| **Branch** | `fix/user-profiles-fk-index` |
| **Depends on** | none |

---

## Problem

`docs/ARCHITECTURE.md` §6.3 states: "Every foreign key column must have an index." `packages/db/src/schema.ts` defines `userProfiles.userId` as a foreign key to `users.id` (`.references(() => users.id, { onDelete: 'cascade' })`), but no index on that column exists anywhere in `supabase/migrations/`. Every lookup of a profile by user (the `user_profiles_update_own` RLS policy's `EXISTS (... WHERE users.id = user_profiles.user_id ...)` subquery, and any future `JOIN users ... ON user_profiles.user_id = users.id`) does a sequential scan on `user_profiles` until this is added. It's cheap to fix now, before the table has meaningful row counts, and expensive to discover later as a slow-query incident.

---

## Background

While checking this, a broader gap surfaced: `supabase/migrations/` contains only two files — `20260629000000_add_account_status.sql` (adds a column) and `20260702000000_rls_policies_users_user_profiles.sql` (RLS policies). Neither contains the `CREATE TABLE` statements for `users` or `user_profiles` themselves. The tables clearly exist live (handoff 020 ran migrations against them; handoffs 012/022/024 alter them), but their baseline schema was evidently created outside the migration history captured in this repo — the same pattern handoff 022 already flagged for RLS being toggled via the dashboard ahead of a migration.

This handoff does **not** attempt to retroactively baseline the full `CREATE TABLE` history — that's a larger reverse-engineering exercise (introspecting the live schema and reconciling it against `schema.ts`) that deserves its own scoped pass, and isn't blocking anything today. It's scoped narrowly to the one concrete, low-risk, high-value fix: add the missing index, idempotently, the same way handoff 024 made the RLS migration safe to rerun. Note plainly: **I cannot verify from the repo alone whether this index already exists on the live database** (since the table creation itself isn't in version control) — `CREATE INDEX IF NOT EXISTS` handles that ambiguity safely either way, but Alex should know the live schema's true current state can't be confirmed from the repo, only from Supabase directly.

---

## Affected files

- `supabase/migrations/20260703000000_add_user_profiles_user_id_index.sql` — new migration

---

## Token dependencies

None — database only.

---

## Implementation steps

1. **Add the index migration**

   ```sql
   -- Migration: add missing FK index on user_profiles.user_id
   -- Handoff 032 — ARCHITECTURE.md §6.3 requires an index on every FK column.
   -- Idempotent: safe to rerun regardless of current live state, which cannot
   -- be confirmed from the migration history alone (see handoff 032 background).

   CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
     ON user_profiles (user_id);
   ```

   Naming follows `docs/ARCHITECTURE.md` §5.1: `idx_{table}_{column}`.

   Commit: `fix: add missing FK index on user_profiles.user_id`

---

## Verification

- [ ] Running the migration against the live database succeeds (whether or not the index already existed).
- [ ] Running it a second time produces no error.
- [ ] `\d user_profiles` in `psql` (or the equivalent Supabase Studio view) shows `idx_user_profiles_user_id` on `user_id`.

---

## What this handoff does NOT cover

- Reconstructing/baselining the `CREATE TABLE` history for `users` and `user_profiles` in `supabase/migrations/` — flagged above as a real gap, but out of scope here. Worth a dedicated future handoff once there's time to introspect the live schema safely.
- Confirming the *current* live index state directly (Alex would need to check Supabase Studio or run `\di` against the live database to know for certain what existed before this migration ran).
