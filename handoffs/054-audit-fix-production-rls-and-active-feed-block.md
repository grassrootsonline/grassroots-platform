# Audit/fix RLS on production + staging, diagnose active users blocked from `/feed`

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `critical` |
| **Type** | `fix` |
| **Branch** | `fix/rls-audit-active-feed-block` |
| **Depends on** | none |

---

## Problem

Two related reports from Alex:

1. **RLS appears to be off on production tables.** Handoffs 022/024 formalized RLS + a `users_select_own` policy (`USING (auth.uid() = auth_id)`) on `users`, plus two policies on `user_profiles` — captured in `supabase/migrations/20260702000000_rls_policies_users_user_profiles.sql`. Given handoff 053's finding that migration history isn't CLI-tracked and everything has been applied by hand, it's very plausible this specific migration was never actually run against the *current* production project, or was applied and later reverted/toggled off during one of the earlier live-debugging sessions (the ENOTFOUND / `relation users does not exist` / password-auth incidents while standing up staging all involved direct dashboard/SQL work under pressure).

2. **An account switched from `waitlisted` to `active` still can't reach `/feed`** — even navigating there directly, not just via the `/waitlisted` auto-redirect gap that handoff 049 addressed. This is a different, more serious symptom than 049: 049 was about a missing redirect *away* from `/waitlisted`; this is the fail-closed gate on `/feed` itself apparently not recognizing an active account.

**These two may be the same bug.** `middleware.ts`'s account-status check reads `account_status` through the Supabase JS client using the **anon key**, not Drizzle/service role:

```ts
const { data: profile, error: profileError } = await supabase
  .from('users')
  .select('account_status')
  .eq('auth_id', user.id)
  .single();
```

If RLS is enabled on `users` in production but the `users_select_own` policy is missing (rather than RLS being fully disabled), this query returns zero rows for every user, `profile` is `undefined`, `status` is `undefined`, and `undefined !== 'active'` is always true — so the fail-closed gate redirects to `/waitlisted` regardless of what the real column value is. That would explain the `/feed` block precisely. It does *not* immediately explain "RLS looks off," though — if RLS were genuinely disabled (not just missing a policy), the same query would succeed unconditionally with no restriction at all, which wouldn't block anything. **Don't assume which of these it is — confirm the actual state directly** (Alex may have checked RLS status by a method that doesn't perfectly distinguish "disabled" from "enabled with no working policy," e.g. eyeballing the dashboard mid-troubleshooting).

**Not the cause: Realtime.** Alex wondered if this is a Realtime/caching issue. It isn't — `middleware.ts` runs this query fresh, synchronously, on every request; there's no subscription, no cache, no stale-JWT-claim involved. `account_status` isn't stored in the session JWT. Worth ruling this out explicitly in your report so it doesn't get re-raised later, but don't spend time building anything Realtime-related to "fix" this.

---

## Affected files

- Likely none in the repo if this is purely a live-database state issue (RLS/policies) — this may be entirely a Supabase-side reconciliation, same shape as handoff 053.
- If investigation finds an actual code bug (not just missing RLS state), you'll need to fix `apps/web/src/middleware.ts` — but confirm the root cause before changing code that already matches its own architecture doc.

---

## Implementation steps

1. **Sanity-check the test account first, before assuming an infra bug.** Confirm directly in production: `SELECT id, auth_id, account_status FROM users WHERE auth_id = '<the test account's auth.users id>';` — confirm the row exists, `account_status` really reads `'active'`, and there isn't a typo/wrong-row/wrong-project mixup from when it was manually flipped.

2. **Audit current RLS state on production (`djkoetgmftfwulszepek`).**

   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   SELECT schemaname, tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';
   ```

   Compare against what should exist per `supabase/migrations/20260702000000_rls_policies_users_user_profiles.sql` (`users_select_own` on `users`; `user_profiles_select_public` + `user_profiles_update_own` on `user_profiles`) and `20260705000000_add_career_interest_signups.sql` (RLS on, zero policies, by design). Report exactly what you find — which tables have RLS enabled, which policies actually exist, and where reality diverges from the migration files.

3. **Repeat the same audit on staging (`ralyzsuobkrgfgpkcchs`)** — cheap to check while you're already in both projects for handoff 053, and the same "applied by hand, may have drifted" risk applies equally there.

4. **Reconcile any gaps found**, using the exact policy definitions already in the migration files (don't invent new ones) — idempotent, same pattern as the source migration:

   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "users_select_own" ON users;
   CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = auth_id);

   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
   DROP POLICY IF EXISTS "user_profiles_select_public" ON user_profiles;
   CREATE POLICY "user_profiles_select_public" ON user_profiles FOR SELECT USING (true);
   DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
   CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE
     USING (EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles.user_id AND users.auth_id = auth.uid()));

   ALTER TABLE career_interest_signups ENABLE ROW LEVEL SECURITY;
   -- zero policies by design, per handoff 044
   ```

   Apply directly against whichever project(s) step 2/3 found drift in — don't blanket-run this against a project that already matches, just to keep the audit trail (from step 2/3's report) meaningful.

5. **After reconciling, directly re-test the `/feed` block**: with the same test account confirmed `active` in step 1, sign in and navigate to `/feed`. Confirm access now succeeds. If it still doesn't, the root cause isn't RLS — add temporary logging around the `middleware.ts` account-status fetch (log `profile`, `profileError`, and `status` — remove before merging) to see exactly what's coming back, and report findings rather than guessing further.

6. **Fold this into handoff 053's scope mentally, not literally** — if production/staging both needed policy reconciliation, note that in the same completion report as 053's migration-repair work, since it's more evidence for the same underlying theme (manual, untracked database changes have drifted from what the migration files describe).

---

## Verification

- [ ] Confirmed (not assumed) whether RLS was actually disabled, or enabled-but-missing-a-policy, on production `users`/`user_profiles` — reported explicitly either way.
- [ ] Same audit completed for staging.
- [ ] All RLS state on both projects now matches what `supabase/migrations/` describes.
- [ ] A real account flipped to `active` can navigate to `/feed` successfully on production.
- [ ] `/waitlisted`, `/signup`, `/login` behavior unchanged for non-active accounts (no regression).
- [ ] If the `/feed` block persists after RLS reconciliation, root cause is re-diagnosed and reported rather than left unresolved silently.
