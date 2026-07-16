# Fix stale idle DB connections causing intermittent 504s across /admin, /admin/board, /feed

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `critical` |
| **Type** | `fix` |
| **Branch** | `fix/db-idle-connection-staleness` |
| **Depends on** | none — related to but independent of handoffs 063/064 |

---

## Problem

Live, recurring production issue reported by Alex (2026-07-14): `/admin` loads fine initially, works for a few minutes, then every request starts failing with `504 GATEWAY_TIMEOUT` / `FUNCTION_INVOCATION_TIMEOUT` on refresh, regardless of which admin section he's in.

Confirmed via `get_runtime_errors`/`get_runtime_logs` this is **not admin-specific** — the same `Vercel Runtime Timeout Error: Task timed out after 30 seconds` hits `/admin`, `/admin/board`, and `/feed` in the same burst windows (11 occurrences since 2026-07-08, most recent 2026-07-14T03:42:29Z). All three routes share one thing: the single `postgres.js` client exported from `packages/db/src/index.ts`.

Confirmed via Supabase Postgres logs (`djkoetgmftfwulszepek`, production) around the same failure windows:

```
unexpected EOF on client connection with an open transaction
could not receive data from client: Connection reset by peer
```

**Root cause:** `packages/db/src/index.ts` constructs its client with `{ prepare: false, max: 3 }` and no `idle_timeout`. `postgres.js` defaults `idle_timeout` to `0` (disabled) — meaning a connection it opens is held open in its local pool indefinitely, with no client-side proactive recycling. Vercel's Fluid Compute keeps warm function instances around between requests (see `docs/VERCEL-BEST-PRACTICES.md` §2), so a `postgres.js` client instance can sit idle for several minutes with live-looking connections in its pool. Something upstream (Supavisor's own idle handling, or a network intermediary between Vercel and Supabase) silently drops connections that go idle long enough — but `postgres.js` has no way to know that happened, and hands the same now-dead connection out for the next query. That query is written to a socket that's already gone; no response ever arrives, and the request hangs until Vercel's `maxDuration` (30s, set in handoff 064) kills the function — which is exactly the `FUNCTION_INVOCATION_TIMEOUT` Alex is seeing.

This also explains the intermittency: only whichever of the pool's 3 connections happens to have gone stale fails on the next reuse, while a request that draws a fresh one succeeds — matching the mixed 200/504 pattern in the runtime logs (e.g. `03:39:28 /admin 200`, then `03:40:12 /admin 504`, then `03:40:42 /admin 200` again).

Ruled out as a cause: an application-level dangling transaction. Grepped the codebase for `.transaction(` — the only related hit is a comment in `apps/web/src/actions/posts.actions.ts` explicitly noting no `db.transaction()` helper is used anywhere yet (sequential awaits, not a transaction). The "open transaction" in the Postgres log refers to the pooler's own connection-level state, not anything left open by application code.

---

## Background

This is a different failure mode from handoffs 063 (`EMAXCONNSESSION` — too many concurrent connections) and 064 (`max: 1` over-serializing fan-outs). Those were about *how many* connections the app holds at once; this is about connections going *stale while idle* and being blindly reused. Both are real, independent issues — 064's `maxDuration: 30` is actually why this fails fast and visibly instead of hanging for 300s, which is working as designed. The missing piece is `idle_timeout`, which makes `postgres.js` proactively close and discard idle connections before they can go stale, rather than trusting them to still be alive indefinitely.

---

## Affected files

- `packages/db/src/index.ts` — add `idle_timeout` and `connect_timeout` to the `postgres()` client options

---

## Implementation steps

### 1. Add idle and connect timeouts to the postgres.js client

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// max: 3 — see handoffs 063/064 for why. Separately: idle_timeout closes a
// connection that's been idle in this client's local pool for N seconds,
// so a warm serverless instance (Fluid Compute keeps these around between
// requests, see docs/VERCEL-BEST-PRACTICES.md) never reuses a connection
// that's gone stale/been reset upstream while sitting idle. Without this,
// postgres.js defaults to idle_timeout: 0 (never closes idle connections),
// which is what caused intermittent 30s FUNCTION_INVOCATION_TIMEOUTs across
// /admin, /admin/board, and /feed after a few idle minutes (handoff 074) --
// confirmed against Supabase Postgres logs showing "unexpected EOF on
// client connection with an open transaction" / "connection reset by peer"
// timed to the same windows. connect_timeout fails a stuck initial
// connection fast instead of silently eating into the 30s function budget.
const client = postgres(connectionString, {
  prepare: false,
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export * from './schema';
```

`idle_timeout: 20` is deliberately short relative to Vercel's warm-instance lifetime — the goal is for this client to always close a connection well before whatever upstream idle limit would silently kill it, so staleness is never a question. `connect_timeout: 10` is generous for a healthy pooler but short enough that a genuinely stuck connect attempt doesn't quietly consume a third of the 30s function budget before anything else even runs.

Commit: `fix(db): add idle_timeout/connect_timeout to prevent stale connection reuse`

---

## Verification

- [ ] `pnpm type-check` passes.
- [ ] Deploy and let the app sit idle for 5+ minutes (no requests), then load `/admin`, `/admin/board`, and `/feed` — all should load normally with no 504.
- [ ] Repeat the idle-then-load check 2-3 times across different idle durations (5 min, 10 min) to build confidence this isn't just lucky timing.
- [ ] Check `get_runtime_errors`/`get_runtime_logs` (Vercel MCP) over the following 24-48 hours — the `Task timed out after 30 seconds` error group tied to `/admin`/`/feed`/`/admin/board` should stop recurring. Don't close this out on a clean first check alone; the bug is intermittent by nature.
- [ ] Check Supabase Postgres logs (`get_logs`, service `postgres`) over the same window for continued `unexpected EOF on client connection with an open transaction` / `connection reset by peer` entries — should also stop.

---

## Note for the advisor record

If this recurs even with `idle_timeout` set, the next place to look is Supavisor's own pooler-side idle/session timeout configuration (not exposed via the Supabase MCP tools available today — would need the Supabase dashboard's pooler settings directly), since `idle_timeout: 20` is a guess at "short enough" without knowing the pooler's actual threshold. Also worth revisiting `max_lifetime` (rotates connections after a fixed total age, not just idle time) as an additional layer if staleness shows up under sustained *active* use rather than idle gaps.
