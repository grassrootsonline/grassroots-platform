# Redis foundation + identity/admin-check caching

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feature` |
| **Branch** | `feat/redis-foundation-identity-cache` |
| **Depends on** | **Alex must provision Upstash Redis first — see Step 0** |

---

## Problem

This is the first real piece of the caching layer `docs/ARCHITECTURE.md`/`ROADMAP.md` already speced (`Cache Layer: Upstash Redis`, four-layer hierarchy, `lib/redis/` listed as "planned but not yet created") but that has never been built. It's the direct follow-up to the recurring `/admin` timeout incidents (handoffs 063/064) — confirmed via Vercel logs that a burst of concurrent `/admin/*` requests exhausts the `max: 3` Postgres connection budget, because **every single gated request re-resolves identity from Postgres**: `middleware.ts` queries `users.account_status` on every request to a gated route, and `requireAdmin()` queries `users` then `admin_users` on every `/admin/*` request. Neither of these changes often — this is exactly the "cache session/role data, invalidate on write" pattern the architecture doc already calls for (`ROADMAP.md`: *"Role data is cached in Redis (TTL: 5 min) to prevent repeated DB reads on permission-heavy pages"*).

This handoff covers only identity/admin caching — the highest-leverage, highest-risk-if-done-wrong piece, so it gets its own focused handoff rather than being bundled with the lower-stakes dashboard/feed caching (070/072... see 071/072).

**This is also the most safety-critical piece to get right.** This project has already shipped two separate bugs where an admin's status change (`waitlisted → active`) didn't take effect promptly (handoffs 049, 054) — both from gaps in the *existing*, uncached gate logic. Adding a cache on top of that gate is a **new, real way to reintroduce the same bug class** if invalidation isn't wired correctly: if `setAccountStatusAction` doesn't bust the cache the instant it runs, an admin activating a waitlisted user would see it "not work" for up to the cache's TTL. Get the invalidation step right — it is not optional polish, it's the same bug this project has already spent multiple handoffs fixing, wearing a new disguise.

**Second safety principle: Redis must fail open, not closed.** Redis becoming unavailable (misconfigured token, Upstash outage, network blip) must degrade to "do the DB query, like today" — never to "deny access" or throw. A caching layer going down should make the app slower, not broken. Wrap every Redis call in try/catch and treat any error as a cache miss.

---

## Step 0 — Alex: provision Upstash Redis (blocking, not something either of us can do)

1. In the Vercel dashboard, add the **Upstash** integration (Storage → Browse Marketplace → Upstash, or similar path depending on current Vercel UI) to the `grassroots` project, **or** create a database directly at [upstash.com](https://upstash.com) and connect it manually. Either path works — the integration route auto-populates env vars, which is less error-prone.
2. Create **one Redis database** (Upstash's free/hobby tier is more than sufficient at current scale — no need to size up).
3. Confirm `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` land in **both** the production and any preview/staging Vercel environments for this project — the same "did it actually reach the right environment" check that bit `DATABASE_URL` twice already (see the `feedback-verify-database-url-pooler` lesson). Confirm via `vercel env pull` locally, don't assume the integration wired every environment.
4. Tell Claude Code once done — this handoff can't be verified without real credentials.

---

## Affected files

- `apps/web/package.json` — add `@upstash/redis`
- `apps/web/src/lib/redis/client.ts` — new
- `apps/web/src/lib/redis/keys.ts` — new (key-naming helpers, matching `ROADMAP.md`'s `{entity}:{id}:{variant}` convention)
- `apps/web/src/middleware.ts` — cache the `account_status` lookup
- `apps/web/src/lib/auth/require-admin.ts` — cache the admin lookup
- `apps/web/src/actions/admin-users.actions.ts` — invalidate the session cache on status change
- `.env.example` — add the two Upstash env vars (currently missing entirely — not even declared, confirmed via grep)

---

## Implementation steps

### 1. `apps/web/package.json`

```
pnpm add @upstash/redis --filter @grassroots/web
```

Commit: `chore(deps): add @upstash/redis`

### 2. `apps/web/src/lib/redis/client.ts`

REST-based client — works identically in Edge middleware and Node serverless functions, no persistent connection (this is *why* Upstash was chosen over standard Redis, per the architecture doc). Export a single shared instance:

```ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Every call site MUST use this wrapper, never the raw client directly — it
// guarantees the fail-open behavior described in this handoff's Problem
// section. A Redis outage should degrade to "slower", never "broken".
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key)
  } catch (err) {
    console.error('[redis] get failed, falling back to DB', key, err)
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds })
  } catch (err) {
    console.error('[redis] set failed, continuing without cache', key, err)
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (err) {
    console.error('[redis] del failed', key, err)
  }
}
```

Commit: `feat(redis): add Upstash Redis client with fail-open helpers`

### 3. `apps/web/src/lib/redis/keys.ts`

Centralize key names so `middleware.ts`, `require-admin.ts`, and `admin-users.actions.ts` can't drift out of sync with each other (the exact bug class that caused the `admin_users` RLS gap, handoff 058 — two places assuming the same thing without a shared source of truth):

```ts
// Matches ROADMAP.md's {entity}:{id}:{variant} key convention.
export const sessionKey = (authUserId: string) => `session:${authUserId}`
export const adminKey = (userId: string) => `admin:${userId}`
```

Commit: `feat(redis): add shared cache key helpers`

### 4. `apps/web/src/middleware.ts` — cache the `account_status` lookup

Current code (unchanged parts omitted):

```ts
const { data: profile, error: profileError } = await supabase
  .from('users')
  .select('id, account_status')
  .eq('auth_id', user.id)
  .single();
```

Wrap with a cache read-through, keyed by the **auth** user id (the value available before any DB lookup — using the internal `users.id` here would defeat the purpose, since you'd need a DB query to get it first):

```ts
import { cacheGet, cacheSet } from '@/lib/redis/client'
import { sessionKey } from '@/lib/redis/keys'

// ...inside middleware(), after `const { data: { user } } = await supabase.auth.getUser()`

type CachedSession = { id: string; account_status: 'waitlisted' | 'active' | 'suspended' }

let profile: CachedSession | null = await cacheGet<CachedSession>(sessionKey(user.id))
let profileError: { message: string } | null = null

if (!profile) {
  const result = await supabase
    .from('users')
    .select('id, account_status')
    .eq('auth_id', user.id)
    .single();
  profile = result.data
  profileError = result.error
  if (profile) {
    // 30s, not the 3600s in ROADMAP.md's original sketch — this value gates
    // account access (waitlisted/active/suspended), and this project has
    // already shipped two bugs (handoffs 049, 054) where a stale gate check
    // blocked a just-activated user. 30s bounds the worst case even if
    // invalidation (step 6) somehow doesn't fire; it is not a substitute
    // for invalidation, it's a backstop under it.
    await cacheSet(sessionKey(user.id), profile, 30)
  }
}
```

The rest of `middleware.ts` reads `profile?.account_status` exactly as it does today — no other logic changes.

Commit: `perf(middleware): cache account_status lookup in Redis`

### 5. `apps/web/src/lib/auth/require-admin.ts` — cache the admin check

Current code does two sequential queries (`users` then `admin_users`) on every call. Cache the *result* (a boolean) keyed by the internal `users.id`, separately from the `users` lookup itself (the `users` lookup is needed regardless to get `profile.id` for the caller's return value, and it's now covered by handoff 069's `getCurrentUser()` memoization on the Server Component side — `requireAdmin` is called from Server Actions too, which don't benefit from 069, so this still needs its own DB read for `profile.id`; only the `admin_users` check gets cached here):

```ts
import { cacheGet, cacheSet } from '@/lib/redis/client'
import { adminKey } from '@/lib/redis/keys'

export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const profile = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.authId, user.id),
    columns: { id: true },
  });
  if (!profile) throw new Error('Not authenticated');

  let isAdmin = await cacheGet<boolean>(adminKey(profile.id));
  if (isAdmin === null) {
    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.userId, profile.id),
      columns: { id: true },
    });
    isAdmin = !!admin;
    // 5 min — admin grants are manual/bootstrap-only today (no UI action
    // exists to grant/revoke), so staleness risk here is low. Revisit this
    // TTL if a grant/revoke UI is ever built (see ROADMAP's future
    // user_roles system) — that would need the same invalidation treatment
    // step 6 gives account_status.
    await cacheSet(adminKey(profile.id), isAdmin, 300);
  }
  if (!isAdmin) throw new Error('Not authorized');

  return { userId: profile.id };
}
```

Apply the same caching to `middleware.ts`'s own separate `admin_users` query (the one gating `/admin/*` at the edge) — it should read/write the **same** `admin:{user_id}` key via `keys.ts`, so the two independent admin checks (middleware's edge-level gate and `requireAdmin()`'s Server Action-level check) never disagree with each other or need separate tuning.

Commit: `perf(auth): cache admin status check in Redis`

### 6. `apps/web/src/actions/admin-users.actions.ts` — invalidate on write

This is the non-negotiable safety step from the Problem section. The instant an admin changes someone's `account_status`, their cached session must be busted — not wait out the 30s TTL:

```ts
import { cacheDel } from '@/lib/redis/client'
import { sessionKey } from '@/lib/redis/keys'
import { db } from '@grassroots/db';
import { users } from '@grassroots/db/schema';
import { eq } from 'drizzle-orm';

export async function setAccountStatusAction(userId: string, status: 'waitlisted' | 'active' | 'suspended') {
  await requireAdmin();

  const [updated] = await db.update(users).set({ accountStatus: status })
    .where(eq(users.id, userId))
    .returning({ authId: users.authId });

  if (updated) {
    await cacheDel(sessionKey(updated.authId));
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin');
}
```

Note the change from the existing `db.update(...).where(...)` (no `.returning()`) to capturing `authId` back — the cache key is keyed by **auth** user id, not the internal `users.id` this action already has, so this extra `.returning()` is required to know which cache entry to bust.

Commit: `fix(admin): invalidate cached session on account_status change`

### 7. `.env.example`

Add, in the Supabase section or a new one immediately after it:

```bash
# Upstash Redis — caching layer (see docs/ARCHITECTURE.md §Cache Layer)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Commit: `docs: add Upstash Redis env vars to .env.example`

---

## Verification

- [ ] With Redis credentials in place, `/admin`, `/admin/users`, `/admin/careers`, `/feed` all still work exactly as before — this is a caching change, not a behavior change.
- [ ] **Critical path**: activate a waitlisted test account via `/admin/users`, then immediately (within a couple seconds, not after waiting out any TTL) sign in as that account and confirm `/feed` is reachable. This is the regression test for the exact bug class this handoff could reintroduce if invalidation is wrong.
- [ ] Suspend an active account via `/admin/users` and confirm they're blocked on their very next request, not after a delay.
- [ ] Temporarily point `UPSTASH_REDIS_REST_TOKEN` at an invalid value (or block the URL) and confirm the app **still works** — slower (falls through to Postgres every time), but no errors, no broken auth. Revert after confirming.
- [ ] After deploying with real traffic, spot-check `get_runtime_logs` / Supabase's own connection stats to confirm `/admin/*` requests are issuing noticeably fewer Postgres queries than before.
- [ ] `pnpm type-check` passes.

---

Next in this sequence: **071** (cache admin dashboard aggregate counts — low risk) and **072** (cache feed/notifications reads with write-path invalidation — the more involved piece). Both depend on this handoff's Redis client/key helpers.
