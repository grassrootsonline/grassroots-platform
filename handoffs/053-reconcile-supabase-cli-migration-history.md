# Reconcile Supabase CLI migration history (production + staging)

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `chore` |
| **Branch** | `chore/reconcile-migration-history` |
| **Depends on** | none (047 confirmed applied to both environments first) |

---

## Problem

While verifying handoff 047 against production (`djkoetgmftfwulszepek`) and staging (`ralyzsuobkrgfgpkcchs`), Claude Code found that neither project has `supabase_migrations.schema_migrations` — the Supabase CLI's own tracking table doesn't exist, and `supabase migration list` shows all 5 files in `supabase/migrations/` as "unapplied remotely," even though the live schema clearly reflects all of them. Every migration to date was applied by hand (SQL editor or direct `psql`), never through `supabase db push`.

This is exactly what you'd expect given the disaster-recovery gap flagged earlier in this project (the original `CREATE TABLE` for `users`/`user_profiles` predates the migration history — it was created via `drizzle-kit push`, never captured as a migration file). This handoff doesn't fix that deeper gap (see Background) — it fixes a narrower, more urgent problem: **`supabase db push` is not currently safe to run against either environment.** Without CLI-tracked history, it would try to replay all 5 existing `CREATE TABLE`/`ALTER TABLE`/`CREATE INDEX` statements from scratch against tables and indexes that already exist — some are `IF NOT EXISTS`-guarded and would no-op harmlessly, but not all of them are (e.g. the RLS policy migration uses bare `CREATE POLICY`, which errors if the policy already exists).

---

## Background

Reconciling now, while there are only 5 migration files, is cheap. The longer this goes unaddressed, the more files accumulate that would need the same treatment, and the more risk there is that someone reaches for `supabase db push` on instinct (it's the obvious command) and it fails partway through, or silently errors past a bare `CREATE POLICY`/`CREATE TYPE`, leaving schema and migration history in an inconsistent state.

**This does not fix the underlying baseline-table gap.** Marking all 5 existing files as "applied" just tells the CLI these specific files have already run — it says nothing about the fact that the migration history, even taken as a whole, cannot rebuild a fresh database from scratch (there's no `CREATE TABLE users`/`CREATE TABLE user_profiles` anywhere in `supabase/migrations/`). That's a separate, real disaster-recovery problem worth its own handoff later — a schema-only dump (`supabase db dump --schema public -f 00000000000000_baseline.sql` or equivalent) inserted at the start of history — but reconciling CLI tracking for the *existing* files doesn't require solving that first. Flagging it again here so it isn't lost; happy to scope it as a follow-up handoff if you want to tackle it.

---

## Affected files

None in the repo — this is a one-time operation against the Supabase CLI's remote tracking state for both projects. No new migration file, no code change.

---

## Implementation steps

1. **Reconcile production (`djkoetgmftfwulszepek`)**

   Link to the project (or use `--project-ref` on each command if you prefer not to switch the linked project):

   ```
   supabase link --project-ref djkoetgmftfwulszepek
   supabase migration repair --status applied 20260629000000
   supabase migration repair --status applied 20260702000000
   supabase migration repair --status applied 20260703000000
   supabase migration repair --status applied 20260705000000
   supabase migration repair --status applied 20260707000000
   ```

   `migration repair --status applied` only writes a row into `supabase_migrations.schema_migrations` marking that version as already run — it does not execute the migration's SQL. Confirm with `supabase migration list` afterward: all 5 should show as applied both locally and remotely, no divergence.

2. **Reconcile staging (`ralyzsuobkrgfgpkcchs`)**

   Repeat the same 5 `migration repair` calls against the staging project ref:

   ```
   supabase link --project-ref ralyzsuobkrgfgpkcchs
   supabase migration repair --status applied 20260629000000
   supabase migration repair --status applied 20260702000000
   supabase migration repair --status applied 20260703000000
   supabase migration repair --status applied 20260705000000
   supabase migration repair --status applied 20260707000000
   ```

3. **Do not run `supabase db push` as part of this handoff.** The point of this reconciliation is to make a *future* `db push` safe once a new migration is actually added — there's no new schema change to push right now.

---

## Verification

- [ ] `supabase migration list --project-ref djkoetgmftfwulszepek` shows all 5 versions as applied both locally and remotely.
- [ ] `supabase migration list --project-ref ralyzsuobkrgfgpkcchs` shows the same.
- [ ] No migration SQL was re-executed against either database (repair only touches the tracking table — confirm no unexpected side effects, e.g. no duplicate-policy errors surfaced).
- [ ] Note in your completion summary whether `docs/ARCHITECTURE.md` or `README.md` should mention "CLI-tracked migrations from this point forward" as a workflow note — Alex hasn't decided this yet, just flag it rather than adding it unprompted.
