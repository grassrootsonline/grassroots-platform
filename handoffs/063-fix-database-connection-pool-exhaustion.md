# Fix production DB connection pool exhaustion (EMAXCONNSESSION) since feed launch

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `critical` |
| **Type** | `fix` |
| **Branch** | `fix/db-connection-pool-exhaustion` |
| **Depends on** | none — but confirms/extends handoff 042 |

---

## Problem

Live production incident, confirmed against real Vercel runtime logs (pasted by Alex) and Supabase's own Postgres logs (pulled directly via the Supabase MCP for `djkoetgmftfwulszepek`, production). Repeated errors since the feed went live (PR #91, main):

```
k: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15
code: 'XX000', severity_local: 'FATAL'
```

Hitting `/admin` (500s), `/admin/careers` routes, and `/feed` (degraded but often still 200) in production. This is Supavisor's own pool-exhaustion error — `EMAXCONNSESSION`, "session mode," and "pool_size" are Supavisor/PgBouncer-specific terms, not plain Postgres. Confirmed directly against the production Postgres logs: bursts of `connection authenticated: identity="postgres"` arriving in tight pairs/triples correlate almost exactly (within ~1 second) with the timestamps of `/admin` and `/feed` requests in Alex's Vercel log dump — these are Supavisor's backend connections to Postgres, opened per-client in session mode, capped at 15 total. Once concurrent requests need more than 15 held-open backend connections, new ones get rejected outright.

**Root cause, in two parts:**

1. **DATABASE_URL is very likely still pointed at Supavisor's session-mode pooler, not the transaction-mode pooler.** This exact problem was already diagnosed and documented in handoff 042 ("runtime app needs the transaction pooler, not the direct connection") — but that handoff could only fix `.env.example`/`docs/ARCHITECTURE.md`, since there is no tool available (to me or to you) that can read or write the actual secret value of a Vercel environment variable. Handoff 042 explicitly flagged this as unconfirmed: *"Production likely already has the correct pooler connection string configured directly in Vercel (since it works)"* — that was a guess, made before the feed existed to stress-test it. This incident is the first real evidence, and it points the other way: the error text wouldn't say "session mode" at all if `DATABASE_URL` were the transaction-mode (`:6543`) string.

2. **The feed launch (059/060/061) sharply increased concurrent DB round-trips per request**, which is what pushed a marginal session-mode pool over the edge:
   - `apps/web/src/app/(platform)/layout.tsx` — `Promise.all([getCurrentUser(), getNotifications()])`, 2 concurrent queries, on **every** platform page load.
   - `apps/web/src/app/(platform)/feed/page.tsx` — `Promise.all([getFeedPosts(), getTrendingProjects(), getWhoToFollow(), getUserProjects()])`, 4 more concurrent queries.
   - `getFeedPosts()`'s own implementation (per handoff 059) additionally calls `this.getCurrentUser()` again internally to compute `likedPostIds` — a redundant extra query on top of the one `layout.tsx` already made.
   - `/admin/*` pages each call `requireAdmin()` (2 sequential queries: `users` then `admin_users`) plus their own dashboard/list queries.

   None of this is wrong on its own — it's normal Next.js Server Component data-fetching — but every one of those is a **new backend connection** under a session-mode pooler capped at 15. Before the feed, page loads were 1-2 queries each; now a single `/feed` load alone can account for 6+ held connections, and a few concurrent users exhaust the pool immediately. This is exactly the failure mode a transaction-mode pooler exists to prevent (it multiplexes many logical client connections onto a small number of actual backend connections instead of holding one 1:1 per request).

A secondary, unrelated bug surfaced in the same Postgres logs, worth fixing in the same pass since it's already live: two `duplicate key value violates unique constraint` errors (`post_reactions_post_user_unique`, `follows_follower_following_unique`) — a check-then-insert race in `reactToPostAction`/`followUserAction` (handoff 059) where two near-simultaneous requests (double-click, or a client retry triggered by the connection errors above) can both pass the "not already reacted/following" check before either insert commits.

---

## Affected files

- **Vercel dashboard / CLI** — `DATABASE_URL` env var for Production (and Preview/staging), no repo file
- `packages/db/src/index.ts` — add a `max` connection cap
- `apps/web/src/actions/posts.actions.ts` — harden `reactToPostAction` against the race
- `apps/web/src/actions/follows.actions.ts` — harden `followUserAction` against the race

---

## Implementation steps

### 1. Confirm and fix `DATABASE_URL` in Vercel — do this first, it's the dominant fix

Neither of us has a tool that can read or write Vercel's secret env var values directly, but you're running locally with the Vercel CLI already linked to this project (per the deploys happening from your machine). Use it directly:

```
vercel env pull .env.production.local --environment=production
```

Inspect the `DATABASE_URL` line. If the host is `*.pooler.supabase.com:5432` (session mode) or the direct `db.<ref>.supabase.co:5432` host, that's the bug. Fix it via:

```
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
```

pasting the **Transaction pooler** connection string from the Supabase dashboard's Connect panel for `djkoetgmftfwulszepek` — host format `aws-0-<region>.pooler.supabase.com:6543`, username format `postgres.<project-ref>` (not just `postgres`). This is exactly what handoff 042 already documented in `.env.example` — copy it from there if you want the annotated version, but the live value is what actually matters here and has apparently never been verified.

**Repeat for the staging Vercel environment** (`ralyzsuobkrgfgpkcchs`) — check `.env.preview.local` via `vercel env pull .env.preview.local --environment=preview`, same fix if it has the same problem. Staging is separately known to be non-functional right now (see the paused staging investigation in project notes) — this may or may not be part of that, but don't skip checking it while you're already in here.

**Redeploy production after changing the env var** — Vercel doesn't retroactively apply env var changes to already-built deployments; a new deployment (or a redeploy of the current one) is required to pick it up.

Commit: none for this step (infra config only) — note it explicitly in your completion report instead, including what the `DATABASE_URL` host/port actually was before you changed it, so this is confirmed rather than assumed for good this time.

### 2. Cap the postgres.js client's connection pool — defense in depth, do this regardless of step 1's outcome

`packages/db/src/index.ts` currently has no `max` set, so `postgres.js` defaults to `max: 10` **per client instance** — and each warm Vercel serverless function instance holds its own client instance. Under concurrent traffic, Vercel can spin up many function instances simultaneously, each able to open up to 10 connections; that's a second, independent way to blow past any pool cap, transaction-mode or not.

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// max: 1 — each serverless function instance should hold at most one
// connection; the transaction pooler (see DATABASE_URL guidance) is what
// multiplexes many function instances onto a small number of real backend
// connections. A higher `max` here just means each instance can exhaust
// more of the pool by itself. (Root-caused in handoff 063 — production hit
// EMAXCONNSESSION/pool_size:15 after the feed launch increased concurrent
// queries per request.)
const client = postgres(connectionString, { prepare: false, max: 1 });

export const db = drizzle(client, { schema });

export * from './schema';
```

Commit: `fix(db): cap postgres.js connection pool to 1 per serverless instance`

### 3. Harden `reactToPostAction` against the check-then-insert race

Current code (handoff 059) does a `findFirst` then conditionally `insert`/`delete` — two near-simultaneous calls can both pass the check. Catch the unique-constraint violation on insert and treat it as "already reacted" rather than letting it throw:

```ts
export async function reactToPostAction(postId: string): Promise<{ liked: boolean; reactionCount: number } | { error: string }> {
  const { userId } = await requireSession();

  const existing = await db.query.postReactions.findFirst({
    where: and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)),
  });

  if (existing) {
    // ...unchanged unlike path
  }

  try {
    await db.insert(postReactions).values({ postId, userId });
  } catch (err) {
    // Race: another concurrent request already inserted the same (postId, userId)
    // row between our findFirst check and this insert. Treat as already-liked,
    // not an error — the end state (liked=true) is what both callers wanted.
    if (isUniqueViolation(err)) {
      const [row] = await db.select({ reactionCount: posts.reactionCount }).from(posts).where(eq(posts.id, postId));
      return { liked: true, reactionCount: row?.reactionCount ?? 0 };
    }
    throw err;
  }
  // ...unchanged rest of the like path (count increment, notification)
}
```

Add a small shared helper (e.g. in `apps/web/src/lib/db-errors.ts`) rather than duplicating the check inline in both files:

```ts
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23505';
}
```

(`23505` is Postgres's standard SQLSTATE for `unique_violation` — stable across Postgres versions, safe to match on.)

Commit: `fix(posts): handle race condition in reactToPostAction gracefully`

### 4. Same fix for `followUserAction`

Same pattern — catch `23505` on the `follows` insert, treat as already-following:

```ts
try {
  await db.insert(follows).values({ followerId: userId, followingId: targetUserId });
} catch (err) {
  if (isUniqueViolation(err)) {
    return { following: true } // already following — same end state, not an error
  }
  throw err;
}
```

Commit: `fix(follows): handle race condition in followUserAction gracefully`

---

## Verification

- [ ] Confirmed (not assumed) what `DATABASE_URL`'s actual host/port was for production before this fix — reported explicitly, since handoff 042's guess about it turned out to matter.
- [ ] Production `DATABASE_URL` now uses the transaction pooler (`:6543`, `postgres.<ref>` username format) for both production and staging Vercel environments.
- [ ] Production redeployed after the env var change.
- [ ] `EMAXCONNSESSION` no longer appears in Vercel runtime logs or Supabase Postgres logs under normal traffic — spot-check both after redeploying, don't just assume the fix worked.
- [ ] `/admin`, `/admin/careers`, `/feed` all load without 500s under a few rapid concurrent requests (manually mash refresh a few times, or ask a couple of the real activated users to hit `/feed` simultaneously).
- [ ] Double-clicking a like button or follow button in quick succession no longer produces an unhandled error — count/follow state settles correctly either way.
- [ ] `pnpm type-check` passes.

---

## Note for the advisor record

This is the second time a `DATABASE_URL`/pooler-mode issue has caused a real outage in this project (first was staging's `ENOTFOUND` from the direct-connection host, handoff 042) — both times because there's no tool access (mine or Claude Code's MCP toolset) to actually read the live secret value and confirm it, only ability to reason about what it's *probably* set to from symptoms. If this recurs a third time, it's worth explicitly documenting the confirmed-correct `DATABASE_URL` value's host/port pattern (not the credentials) somewhere both of us can check without needing secret access — e.g., a non-secret `NEXT_PUBLIC_DB_POOLER_MODE` sanity-check env var, or just a standing note in `docs/ARCHITECTURE.md` once this is confirmed fixed.
