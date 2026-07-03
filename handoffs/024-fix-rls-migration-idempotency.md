# Make the RLS policy migration idempotent, correct its stale comment

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `low` |
| **Type** | `fix` |
| **Branch** | `fix/rls-migration-idempotency` |
| **Depends on** | none |

---

## Problem

`supabase/migrations/20260702000000_rls_policies_users_user_profiles.sql` (handoff 022) is not safely re-runnable and its comment is factually wrong. When Alex ran it against the live database, `CREATE POLICY "users_select_own"` failed with `policy "users_select_own" for table "users" already exists` — meaning the policy from handoff 012 was in fact live, contradicting the file's own comment ("zero policies currently exist on public.users or public.user_profiles"). Because the SQL Editor runs a pasted script as one transaction, that error aborted the run before the two `user_profiles` policy statements below it executed. Alex worked around it manually by running the remaining statements directly; the migration file itself still isn't fixed.

---

## Background

Whatever caused the discrepancy (the policy may have been applied outside this migration's own history, or the earlier live-DB check was run against a different moment in time), the fix is the same either way: every statement in this file should be safe to run again without erroring, so `supabase/migrations/` reflects what's actually live and can be reapplied without manual intervention next time.

---

## Affected files

- `supabase/migrations/20260702000000_rls_policies_users_user_profiles.sql`

---

## Token dependencies

None.

---

## Implementation steps

1. **Make each policy statement idempotent**

   Precede every `CREATE POLICY` with a matching `DROP POLICY IF EXISTS`, and replace the stale comment with an accurate one:

   ```sql
   -- Migration: formalize RLS on users/user_profiles, add user_profiles policies
   -- Handoff 022 (idempotency fix: handoff 024)

   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

   DROP POLICY IF EXISTS "users_select_own" ON users;
   CREATE POLICY "users_select_own"
     ON users FOR SELECT
     USING (auth.uid() = auth_id);

   DROP POLICY IF EXISTS "user_profiles_select_public" ON user_profiles;
   CREATE POLICY "user_profiles_select_public"
     ON user_profiles FOR SELECT
     USING (true);

   DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
   CREATE POLICY "user_profiles_update_own"
     ON user_profiles FOR UPDATE
     USING (
       EXISTS (
         SELECT 1 FROM users
         WHERE users.id = user_profiles.user_id
           AND users.auth_id = auth.uid()
       )
     );
   ```

   Commit: `fix: make RLS policy migration idempotent, correct stale comment`

---

## Verification

- [ ] Running the full file against the live database twice in a row produces no errors either time
- [ ] `pg_policies` still shows exactly `users_select_own`, `user_profiles_select_public`, `user_profiles_update_own` after both runs (not duplicated, not renamed)
