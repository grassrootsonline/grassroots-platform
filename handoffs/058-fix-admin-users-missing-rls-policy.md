# Fix `/admin` always redirecting to `/feed` — missing RLS policy on `admin_users`

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `critical` |
| **Type** | `fix` |
| **Branch** | `fix/admin-users-rls-policy` |
| **Depends on** | none |

---

## Problem

This is my own scoping mistake in handoff 052, not a Claude Code implementation error — flagging that plainly before the fix.

Handoff 052's migration (`supabase/migrations/20260707010000_add_admin_careers_tables.sql`) enables RLS on `admin_users` with **zero policies**, justified by this comment: *"Deliberately zero policies — write-only via Drizzle/service role, no anon read path."* That claim is wrong. The same handoff's `middleware.ts` snippet reads `admin_users` through the **anon-key Supabase JS client**, not Drizzle:

```ts
const { data: admin } = profile?.id
  ? await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle()
  : { data: null };
```

With RLS on and no `SELECT` policy, this query returns nothing for **every** user, including real admins — `admin` is always `null`, so the gate redirects everyone to `/feed`, exactly what Alex is seeing. This is the identical failure shape investigated in handoff 054 (missing `users_select_own` blocking the account_status read) — same mechanism, different table, and this time the gap was in the original migration design, not drift from a hand-applied change.

---

## Affected files

- `supabase/migrations/<today's date>_add_admin_users_select_policy.sql` — new migration

---

## Implementation steps

1. **Sanity-check the bootstrap row still exists first**, before assuming the policy is the only issue: `SELECT * FROM admin_users;` on production — confirm Alex's account is actually in there. If it's missing, that's a separate, additional problem (re-run the bootstrap insert from handoff 052's background section); don't let a genuinely-missing row masquerade as "the policy fix didn't work."

2. **Add the missing self-read policy**, matching the same self-row pattern already established for `users_select_own` and `user_profiles_update_own` (handoff 022/024) — `admin_users.user_id` is a FK to `users.id`, not the auth UID directly, so it needs the same join-based `EXISTS` check `user_profiles_update_own` uses:

   ```sql
   -- Migration: add missing self-read policy on admin_users
   -- Handoff 058 — corrects an error in handoff 052's original migration, which
   -- claimed admin_users had "no anon read path." It does: middleware.ts's admin
   -- gate reads it via the anon-key Supabase JS client, the same way the
   -- account_status check reads `users`. Without this policy, RLS silently
   -- blocks that read for everyone, so the admin gate always fails closed.

   DROP POLICY IF EXISTS "admin_users_select_own" ON admin_users;
   CREATE POLICY "admin_users_select_own"
     ON admin_users FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM users
         WHERE users.id = admin_users.user_id
           AND users.auth_id = auth.uid()
       )
     );
   -- Still no insert/update/delete policy, and no policy letting a user read
   -- *another* user's admin_users row — this only lets someone confirm their
   -- own admin status, which is exactly what the middleware gate needs.
   ```

   Apply to production (and staging, if its schema is being kept in sync per the usual practice — note which environment(s) you applied it to).

   Commit: `fix: add missing admin_users self-read RLS policy`

3. **Re-test `/admin` access end-to-end** with the same account Alex is using, after confirming step 1's row exists and step 2's policy is applied.

---

## Verification

- [ ] Confirmed an `admin_users` row exists for the test account (not just assumed).
- [ ] `admin_users_select_own` policy exists and matches the exact definition above.
- [ ] The test account can now reach `/admin` and is not redirected to `/feed`.
- [ ] A non-admin active account is still correctly redirected to `/feed` from `/admin` (no regression — confirm the policy doesn't accidentally expose other users' rows, just the caller's own).
- [ ] If `/admin` still redirects after this fix, the row-existence check from step 1 is revisited before looking for a third cause.
