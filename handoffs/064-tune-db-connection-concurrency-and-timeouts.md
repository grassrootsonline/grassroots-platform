# Tune DB connection concurrency + add maxDuration safety net

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/db-concurrency-and-max-duration` |
| **Depends on** | `063` (transaction pooler + `max: 1` — already merged, confirmed working) |

---

## Problem

Handoff 063's fix worked — `EMAXCONNSESSION` (session-mode pool exhaustion) hasn't recurred since it merged. But two new errors appeared on the very next deployment, confirmed via `get_runtime_errors`/`get_runtime_logs` (Vercel MCP) against `prj_XDp0Qm5VOSVyOHF8O6lGZNHp8vvF`:

- `canceling statement due to statement timeout` (Postgres `57014`) on `/admin` and `/feed.rsc`
- `Vercel Runtime Timeout Error: Task timed out after 300 seconds` on `/admin`

Root cause: `max: 1` (063's fix) was more conservative than it needed to be. Several routes fire multiple DB queries concurrently within one request — `(platform)/layout.tsx` does `Promise.all([getCurrentUser(), getNotifications()])`, `feed/page.tsx` does `Promise.all([getFeedPosts(), getTrendingProjects(), getWhoToFollow(), getUserProjects()])`, and `admin/page.tsx`'s dashboard does its own `Promise.all` of four count queries. With `max: 1`, every one of those queries funnels through a single connection and queues behind whichever one is running — under concurrent traffic that queue can back up badly enough to hit Vercel's default 300-second function ceiling (no `maxDuration` is currently set anywhere in the app, so routes get the platform's max by default).

Now that the transaction pooler is confirmed working (that's what actually caps real backend-connection usage, not the app's `max`), there's no reason to keep per-instance concurrency capped at 1 — raise it enough to let a single warm instance serve its own request's concurrent queries in parallel, while adding an explicit, much lower `maxDuration` as a backstop so a genuinely stuck request fails fast (freeing its connection) instead of hanging for 5 minutes.

---

## Affected files

- `packages/db/src/index.ts` — raise `max`
- `apps/web/src/app/admin/layout.tsx` — add `maxDuration`
- `apps/web/src/app/(platform)/layout.tsx` — add `maxDuration`

---

## Implementation steps

### 1. Raise `max` from 1 to 3

```ts
// packages/db/src/index.ts
const client = postgres(connectionString, { prepare: false, max: 3 });
```

3 is a deliberate middle ground — enough for a single request's own internal `Promise.all` fan-out (the largest today is 4 concurrent queries, in `feed/page.tsx`) to mostly run in parallel rather than fully serialize, while staying nowhere near the transaction pooler's real capacity. Do not raise this above single digits without re-checking `pool_size` via Supabase — the pooler multiplexes, but there's no reason to guess higher than the evidence supports. If `get_runtime_errors` shows the timeout errors persisting after this change (see Verification), it's fine to try `max: 5` next rather than treating 3 as final — just don't jump straight there without confirming 3 wasn't enough.

Commit: `fix(db): raise postgres.js max from 1 to 3 now that transaction pooling is confirmed`

### 2. Add `maxDuration` to both layouts that showed timeouts

```ts
// apps/web/src/app/admin/layout.tsx — add near the top, alongside other exports
export const maxDuration = 30;
```

```ts
// apps/web/src/app/(platform)/layout.tsx — add near the top
export const maxDuration = 30;
```

30 seconds is generous for any legitimate query this app runs today (current data volume is tiny — 2 real users) while being short enough that a stuck request fails fast and visibly (a 500/timeout error) rather than hanging silently for 5 minutes, holding a connection the whole time. `maxDuration` set on a layout applies to every route under it, so this covers `/admin`, `/admin/users`, `/admin/careers/*` from the admin layout, and `/feed`, `/feed/[postId]`, `/profile/[username]` from the platform layout — exactly the routes that showed timeouts plus their siblings.

Commit: `fix(routes): add explicit maxDuration to admin and platform layouts`

---

## Verification

- [ ] `pnpm type-check` passes.
- [ ] After deploying, check `get_runtime_errors` (Vercel MCP) for `prj_XDp0Qm5VOSVyOHF8O6lGZNHp8vvF` over the following few hours — confirm neither `statement timeout` nor `Task timed out` recurs under normal use.
- [ ] `EMAXCONNSESSION` still doesn't reappear (confirms `max: 3` didn't undo 063's fix — it shouldn't, since the pooler is what actually bounds real connection count, not this value).
- [ ] `/admin` and `/feed` both load normally under a few rapid manual refreshes.
- [ ] If timeouts persist after this change, report back with the actual error rather than immediately bumping `max` again — there may be a genuinely slow/hung query worth finding directly (e.g. via `EXPLAIN ANALYZE`) rather than papering over it with more concurrency headroom.
