# Add RLS policies for `users` and `user_profiles`, correct RLS claims in ARCHITECTURE.md

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/rls-policies-users-user-profiles` |
| **Depends on** | none |

---

## Problem

Row Level Security has just been enabled on `users` and `user_profiles` directly via the Supabase dashboard — which means it isn't captured anywhere in version control, and the only policy that exists (`"Users can read own account_status"` on `users`, from the `account_status` migration in handoff 012) predates RLS actually being turned on for that table. `user_profiles` has RLS on and zero policies, which currently blocks all access to it through the Supabase JS client path (harmless today only because nothing queries it that way yet — see Background).

Separately, `docs/ARCHITECTURE.md` currently overstates what RLS protects in this codebase:

- §6.3: *"The `anon` key is never used server-side. All server requests use the service role key..."* — `apps/web/src/middleware.ts` uses the anon key server-side today, and correctly so (it's the standard Supabase SSR pattern for resolving `auth.uid()` from the user's session cookie). The line as written is simply false.
- §8.1: *"RLS ... cannot be bypassed by application code. A bug in one layer cannot alone expose unauthorized access."* — `packages/db/src/index.ts` connects Drizzle directly via `DATABASE_URL`, which authenticates as the Supabase `postgres` role. That role owns the tables and bypasses RLS by default, policies or not. Since almost every current read/write (`auth.actions.ts`, the waitlisted page, all seed/signup logic) goes through Drizzle, RLS today only constrains the Supabase-JS-client path (currently: `middleware.ts` alone). The `checkPermission()` layer is the *only* real gate on the Drizzle path right now — the doc should say so.

---

## Background

Alex, Claude Design, and Claude Code agreed on a three-option split for closing the RLS gap: (1) ship policies now for the client-side path only, (2) migrate Drizzle to a non-bypassing role so RLS covers everything, or (3) do (1) now and correct the docs, deferring (2) to its own handoff once there's time to test it without risking the auth/signup path. We're going with (3).

Given that, this handoff is scoped to what's actually reachable via the RLS-constrained path today:

- `users` — only `middleware.ts` reads it via the Supabase JS client, and only its own row (`.eq('auth_id', user.id)`). No code path needs public read of another user's `users` row through that client. The existing owner-only SELECT policy is correct and sufficient; it just needs renaming to match the `{table}_{operation}_{description}` convention in §8.4, and needs RLS formally captured in a tracked migration rather than left as an undocumented dashboard toggle.
- `user_profiles` — no code currently reads or writes it through the Supabase JS client (the signup action inserts it via Drizzle). But it's clearly meant to be the public profile surface (it holds only `display_name`, `bio`, `avatar_url`, `headline` — no sensitive columns), matching the policy example already sketched in `docs/USER_SYSTEM.md`. Add public SELECT and owner-scoped UPDATE now, ahead of the profile-page and settings work that will need them.

`users` mixes public-facing fields (`username`, `display_name`, `bio`, `avatar_url`, `is_verified`, counts) with internal ones (`auth_id`, `account_status`, `is_suspended`, `deleted_at`) in a single table — a holdover from before the five-table user system migration described in `docs/USER_SYSTEM.md`. Because RLS is row-level, not column-level, a public SELECT policy on `users` today would expose `account_status` and `auth_id` to anyone querying through the Supabase JS client. Don't add one. When a feature actually needs public reads of `users` fields via that client (rather than Drizzle), that should force a proper decision — a scoped view or column-level grants — not a blanket `USING (true)`.

---

## Affected files

- `supabase/migrations/<timestamp>_rls_policies_users_user_profiles.sql` — new migration (see naming convention below)
- `docs/ARCHITECTURE.md` — correct §6.3 and §8.1

---

## Token dependencies

None — database and documentation only.

---

## Implementation steps

1. **Create the migration file**

   Follow the existing naming convention (`supabase/migrations/20260629000000_add_account_status.sql`) with today's timestamp, e.g. `supabase/migrations/20260702_rls_policies_users_user_profiles.sql`:

   ```sql
   -- Migration: formalize RLS on users/user_profiles, add user_profiles policies
   -- Handoff 022

   -- RLS was enabled on both tables via the Supabase dashboard ahead of this
   -- migration landing. These statements are idempotent and just bring that
   -- state under version control.
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

   -- Rename the existing account_status policy to match the
   -- {table}_{operation}_{description} convention (ARCHITECTURE.md §8.4).
   ALTER POLICY "Users can read own account_status"
     ON users RENAME TO users_select_own;

   -- user_profiles holds only public-facing fields (display_name, bio,
   -- avatar_url, headline) — safe to expose to any request.
   CREATE POLICY "user_profiles_select_public"
     ON user_profiles FOR SELECT
     USING (true);

   -- Owner-only write. user_profiles.user_id references users.id, not
   -- auth_id, so ownership is resolved through a join to users.
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

   Apply it the same way handoff 020 applied the account_status migration.

   Commit: `fix: formalize RLS on users/user_profiles, add user_profiles policies`

2. **Correct `docs/ARCHITECTURE.md` §6.3**

   Replace:

   > The `anon` key is never used server-side. All server requests use the service role key inside a Supabase server client that enforces RLS bypass only when explicitly required.

   With:

   > Server-side Supabase access uses two distinct clients for two distinct purposes. The anon key + user session cookie (`@supabase/ssr`'s `createServerClient`, used in `middleware.ts` and `lib/supabase/server.ts`) is used wherever a request needs to act *as the current user* under RLS — this is the standard SSR auth pattern, not a bypass. The service role key is reserved for operations that must run as an administrator, bypassing RLS intentionally (none yet in this codebase). Neither key is meant to run arbitrary unscoped queries — see §8.1 for the current gap on the Drizzle path.

   Commit: `docs: correct anon-key-server-side claim in ARCHITECTURE.md`

3. **Add a caveat to `docs/ARCHITECTURE.md` §8.1**

   After the three-layer list, add:

   > **Current gap:** `packages/db` (Drizzle) connects via `DATABASE_URL`, which authenticates as the Supabase `postgres` role. That role owns the tables and bypasses RLS regardless of policy, so RLS today only constrains access made through the Supabase JS client (`middleware.ts` currently; any future client-side or SSR-client reads). For everything that goes through Drizzle — which is most of the app's current reads and writes — `checkPermission()` is the only enforced gate. Making Drizzle RLS-aware (a dedicated non-bypassing Postgres role, `FORCE ROW LEVEL SECURITY`, and policies that account for legitimate server-side writes) is tracked as a follow-up, not yet scheduled.

   Commit: `docs: flag Drizzle RLS-bypass gap in ARCHITECTURE.md §8.1`

---

## Verification

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` runs cleanly for both tables (no-op if already enabled — confirm no error)
- [ ] Policy rename succeeds; `users_select_own` appears in the Supabase Studio policy list, `"Users can read own account_status"` does not
- [ ] `user_profiles_select_public` and `user_profiles_update_own` appear on `user_profiles`
- [ ] As an authenticated test user, confirm you can `SELECT` your own `users` row and any `user_profiles` row via the Supabase JS client, but cannot `SELECT` another user's `users` row
- [ ] Confirm `user_profiles_update_own` blocks updating another user's profile row and allows updating your own
- [ ] `docs/ARCHITECTURE.md` §6.3 and §8.1 read as corrected above
- [ ] Grep `docs/ARCHITECTURE.md` for "service role key inside a Supabase server client that enforces RLS bypass only when explicitly required" — confirm zero results

---

## What this handoff does NOT cover

- Making Drizzle/`DATABASE_URL` RLS-aware (dedicated non-bypassing role, `FORCE ROW LEVEL SECURITY`) — flagged in §8.1 as a follow-up, not scheduled
- Public-read policy or view for `users`-table public fields (username, display_name, follower counts, etc.) via the Supabase JS client — no code needs this yet; add it deliberately when something does
- Any policy work on the five-table user system (`auth_providers`, `user_metadata`, `user_roles`) — those tables don't exist yet
