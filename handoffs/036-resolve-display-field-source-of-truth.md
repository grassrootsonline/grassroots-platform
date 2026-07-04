# Resolve display_name/bio/avatar_url source-of-truth conflict between `users` and `user_profiles`

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `refactor` |
| **Branch** | `refactor/profile-data-source-of-truth` |
| **Depends on** | none |

**Approved by Alex (2026-07-04): Path A.** Migrate profile reads to `user_profiles`, matching root CLAUDE.md's documented convention and making handoff 022's RLS policies load-bearing. Implementation steps below.

---

## Problem

Root `CLAUDE.md`'s own "What fields exist and where" table states:

| Field | Source table |
|---|---|
| `display_name` | `user_profiles.display_name` |
| `bio` | `user_profiles.bio` |
| `avatar_url` | `user_profiles.avatar_url` |

But `apps/web/src/lib/data/supabase-client.ts` (handoff 023) reads all three from `users`, not `user_profiles`:

```ts
const row = await db.query.users.findFirst({
  where: (u, { eq }) => eq(u.authId, user.id),
})
return {
  ...
  name: row.displayName,   // users.display_name
  avatarUrl: row.avatarUrl, // users.avatar_url
  bio: row.bio,             // users.bio
  ...
}
```

Both `getCurrentUser()` and `getUserProfile(username)` do this. `signupAction` (handoff 012/018) does insert a matching row into `user_profiles` at signup — so the two tables currently hold identical values — but every read path ignores `user_profiles` entirely.

---

## Background

`docs/ARCHITECTURE.md` §5.3 explains why both tables exist: `users` (§5.2) is explicitly marked as "the legacy single-role model" that the five-table system (§5.3) "supersedes," with a note that "§5.2 will be updated when the migration handoff is issued." That migration handoff hasn't been issued — `users` still carries `display_name`/`bio`/`avatar_url`/`cover_url` directly, `user_profiles` duplicates three of those four, and nothing has forced a decision about which one is real yet.

This matters beyond tidiness for two concrete reasons:

1. **Silent drift risk.** There's no update path yet (no settings/profile-editing page exists), so the two copies happen to agree today. The first feature that lets a user edit their bio or avatar has to pick one table to write to — and whichever engineer builds it will likely just extend whatever `getCurrentUser()` already reads from (`users`), continuing to orphan `user_profiles`, unless this is decided explicitly first.
2. **The RLS policies from handoff 022 protect the wrong table for what's actually read.** `user_profiles_select_public` and `user_profiles_update_own` were added so the Supabase-JS-client path could safely expose public profile data. But every current read of that data goes through Drizzle against `users` (which has no equivalent public-read policy, deliberately, per handoff 022's own reasoning — `users` mixes public and internal columns). If a future feature reads profile data via the Supabase JS client expecting `user_profiles`'s policies to apply, and the data's actually sourced from `users` in practice, that's a policy that looks like coverage but isn't exercised.

## Two paths, either is defensible

- **(A) Make `user_profiles` the real source.** Update `getCurrentUser()`/`getUserProfile()` to join or query `user_profiles` for `display_name`/`bio`/`avatar_url`, matching root `CLAUDE.md`'s documented convention and making handoff 022's RLS policies actually load-bearing. Requires deciding what happens to the now-redundant columns on `users` (deprecate like `is_suspended`, or drop in a future migration).
- **(B) Make `users` the real source, correct the docs.** Update root `CLAUDE.md`'s convention table to say these fields come from `users`, and either drop the unused duplicate columns from `user_profiles` or repurpose that table for what the five-table design actually intended it for (something other than duplicating `users`).

**My recommendation:** (A). The five-table model in `docs/ARCHITECTURE.md` §5.3 was a deliberate design decision (decoupled auth providers, JSONB metadata, scoped roles) that predates this specific implementation gap, and `user_profiles` is the table CLAUDE.md's own conventions and the existing RLS policies already assume is authoritative. Reading from `users` today looks like it happened because handoff 023 needed the fastest path to real data, not because anyone decided `users` should be the source going forward. But this is a real trade-off — (A) means every future profile read does a join or second query, and touches the same auth insert path handoff 012/018 built — so it deserves your sign-off rather than a silent pick.

---

## Affected files

- `apps/web/src/lib/data/supabase-client.ts` — `getCurrentUser()`, `getUserProfile()`
- `packages/db/src/schema.ts` — annotate the now-redundant `users.displayName`/`bio`/`avatarUrl` columns as deprecated (do not drop them yet — see step 3)
- `docs/ARCHITECTURE.md` §5.2 — note that `display_name`/`bio`/`avatar_url` on `users` are deprecated in favor of `user_profiles`, per the migration note §5.3 already anticipates
- Root `CLAUDE.md` — no change needed; its "What fields exist and where" table already documents `user_profiles` as the source, this handoff makes the code match it

---

## Token dependencies

None — data-layer and schema-comment changes only.

---

## Implementation steps

1. **Update `getCurrentUser()` to source profile fields from `user_profiles`**

   In `apps/web/src/lib/data/supabase-client.ts`, after loading the `users` row by `authId`, also query `user_profiles` by `userId: row.id` and read `displayName`/`bio`/`avatarUrl` from that row instead of the `users` row. Keep `username`, `followerCount`, `followingCount`, `accountStatus` from `users` — those aren't duplicated on `user_profiles` and aren't in scope here.

   ```ts
   async getCurrentUser(): Promise<CurrentUser | null> {
     const supabase = await createServerClient()
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return null

     const row = await db.query.users.findFirst({
       where: (u, { eq }) => eq(u.authId, user.id),
     })
     if (!row) return null

     const profile = await db.query.userProfiles.findFirst({
       where: (p, { eq }) => eq(p.userId, row.id),
     })

     return {
       id: row.id,
       name: profile?.displayName ?? row.displayName,
       username: row.username,
       avatarUrl: profile?.avatarUrl ?? row.avatarUrl,
       bio: profile?.bio ?? row.bio,
       followerCount: row.followerCount,
       followingCount: row.followingCount,
       projectCount: 0,
       accountStatus: row.accountStatus,
     }
   }
   ```

   The `?? row.X` fallback is defensive only — `signupAction` (handoff 012/018) always inserts both rows together, so `profile` should never be missing for a real user. It exists so a data-integrity bug surfaces as slightly-stale display data rather than a crash.

2. **Update `getUserProfile(username)` the same way**

   Same pattern: after finding the `users` row by `username`, query `user_profiles` by `userId: row.id` and source `displayName`/`bio`/`avatarUrl` from there.

3. **Annotate — don't drop — the redundant `users` columns**

   In `packages/db/src/schema.ts`, add a comment above `displayName`, `bio`, and `avatarUrl` on the `users` table:

   ```ts
   // Deprecated as of handoff 036 — display_name/bio/avatar_url are now read
   // from user_profiles. Kept here (a) because users.displayName is NOT NULL
   // and signupAction still writes it at account creation, and (b) dropping
   // columns is a separate, deliberate migration decision, not a side effect
   // of a read-path refactor. Do not read these three columns anywhere new.
   ```

   No migration in this handoff — this is a comment-only annotation. Dropping the columns is future work, not blocking.

4. **Update `docs/ARCHITECTURE.md` §5.2**

   Add a line noting `display_name`/`bio`/`avatar_url` on `users` are deprecated in favor of `user_profiles` (§5.3), resolving the "§5.2 will be updated when the migration handoff is issued" note that section already contains — this is that handoff.

   Commit: `refactor: read profile display fields from user_profiles instead of users`

---

## Verification

- [ ] `getCurrentUser()` and `getUserProfile()` both query `user_profiles`, not just `users`, for `displayName`/`bio`/`avatarUrl`.
- [ ] Existing profile pages render identically for seeded/live users whose `users` and `user_profiles` rows already agree (should be everyone today — no visible behavior change expected).
- [ ] `signupAction` unchanged — still inserts both rows.
- [ ] Grep `supabase-client.ts` for `row.displayName`, `row.bio`, `row.avatarUrl` outside the fallback — confirm none remain as the primary source.
- [ ] `pnpm type-check` passes.

---

## What this handoff does NOT cover

- Dropping the redundant `users` columns — deliberately deferred to a future migration decision.
- Building the settings/profile-editing feature itself, which is what will first make this drift observable to real users.
