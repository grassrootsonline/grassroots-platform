# Resolve display_name/bio/avatar_url source-of-truth conflict between `users` and `user_profiles`

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `needs-approval` |
| **Type** | `refactor` |
| **Branch** | `refactor/profile-data-source-of-truth` (once Alex decides — see below) |
| **Depends on** | none |

**Awaiting Alex's approval before implementation** — this is a choice between two valid data-modeling paths (keep reading profile fields from `users`, or migrate reads to `user_profiles`), and it determines what `checkPermission`/RLS coverage actually protects going forward. Not mine to pick unilaterally.

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

## Affected files (once a path is approved)

- `apps/web/src/lib/data/supabase-client.ts` — `getCurrentUser()`, `getUserProfile()`
- `packages/db/src/schema.ts` — possibly deprecate/annotate redundant `users` columns (path A) or `user_profiles` columns (path B)
- `docs/ARCHITECTURE.md` §5.2/§5.3 — reconcile whichever table is authoritative
- Root `CLAUDE.md` — update or confirm the "What fields exist and where" table

*A full implementation plan with exact steps and a verification checklist will follow once Alex picks a direction — intentionally not written yet, since the steps differ meaningfully between (A) and (B).*

---

## What this handoff does NOT cover

- Any actual code change — this is scoped to surfacing the decision, not implementing either path.
- Building the settings/profile-editing feature itself, which is what will first make this drift observable to real users.
