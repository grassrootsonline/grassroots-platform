# Memoize `getCurrentUser()` per request with React `cache()`

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/memoize-get-current-user` |
| **Depends on** | none — ships immediately, no infrastructure, no Redis, no invalidation logic |

---

## Problem

Found while reading `SupabaseDataClient` to plan the Redis caching work (see the admin-connection-timeout thread, handoffs 063/064): `getCurrentUser()` is called **far more times per request than it needs to be**, and every call does two DB round-trips (`users` + `user_profiles`) plus a Supabase `auth.getUser()` call. Trace a single `/feed` load:

- `(platform)/layout.tsx` calls `client.getCurrentUser()` directly, **and** calls `client.getNotifications()`, whose implementation calls `this.getCurrentUser()` again internally.
- `feed/page.tsx` calls `client.getCurrentUser()` directly, **and** calls `getFeedPosts()` (calls `this.getCurrentUser()` again, to compute `likedPostIds`), **and** `getWhoToFollow()` (calls `this.getCurrentUser()` again, to exclude self / already-followed).

That's five separate invocations of the same "who is logged in" lookup on one page load, each paying its own two-query cost — ~10 queries just establishing identity, before any of the page's actual content queries run. This is pure waste: the answer cannot change mid-request, and `getDataClient()` (`lib/data/index.ts`) creates a **new** `SupabaseDataClient` instance on every call site, so there's no existing instance-level memoization catching this.

This is a genuine, zero-infrastructure fix — React's `cache()` function deduplicates a function's result for the lifetime of a single request/render pass automatically, with no manual invalidation to get wrong (unlike the Redis work, which needs careful TTL/invalidation design because its cache outlives a single request). Do this first, independent of and before the Redis planning work — it directly reduces the query volume on `/admin` and `/feed`, the exact routes that have been timing out.

---

## Affected files

- `apps/web/src/lib/data/supabase-client.ts` — wrap the identity lookup in `cache()`

---

## Implementation steps

Extract the body of `getCurrentUser()` into a module-level function wrapped in React's `cache()`, and have the class method delegate to it. This works correctly across multiple `SupabaseDataClient` instances within the same request — `cache()`'s memoization is keyed by the function reference and its arguments, not by which object called it, and it's automatically scoped to one request's render pass in Next.js's RSC model (nothing leaks across requests or users).

```ts
import { cache } from 'react'
// ...existing imports

const getCachedCurrentUser = cache(async (): Promise<CurrentUser | null> => {
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
})

export class SupabaseDataClient implements DataClient {
  async getCurrentUser(): Promise<CurrentUser | null> {
    return getCachedCurrentUser()
  }
  // ...every other method that currently calls `this.getCurrentUser()` needs no change —
  // they'll transitively hit the same cached result.
```

Scope this to `SupabaseDataClient` only — `SeedDataClient` doesn't touch a real DB, so there's no query cost to save there, and touching it adds risk for no benefit.

Commit: `perf(data): memoize getCurrentUser() per request with React cache()`

---

## Verification

- [ ] `pnpm type-check` passes.
- [ ] `/feed` still renders identically (same user, same posts, same liked/following state) — this is a pure performance change, no behavior should differ.
- [ ] Confirm via a quick manual check (e.g. temporary `console.log` call count, removed before merge, or Supabase's query stats) that a single `/feed` load now calls the underlying `users`/`user_profiles` lookup once instead of five times.
- [ ] After deploying, watch `get_runtime_errors` (Vercel MCP) for a day — this alone should visibly reduce (not necessarily eliminate) the frequency of the `/admin`/`/feed` timeout pattern, since it cuts roughly half the DB round-trips on the exact pages that were struggling.
