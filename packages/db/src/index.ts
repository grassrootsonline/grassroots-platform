import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// max: 3 — the transaction pooler (see DATABASE_URL guidance) is what
// actually bounds real backend-connection usage across all instances, not
// this value. max: 1 (handoff 063) fixed EMAXCONNSESSION/pool_size:15, but
// routes that fan out several queries in one request via Promise.all
// (largest today: 4, in feed/page.tsx) then fully serialize onto that one
// connection — under concurrent traffic the queue backed up far enough to
// hit Vercel's 300s function ceiling (handoff 064). 3 lets a single
// request's own internal fan-out run mostly in parallel while staying
// nowhere near the pooler's real capacity — don't raise further without
// re-checking pool_size via Supabase.
// Disable prefetch as it is not supported for "Transaction" pool mode.
//
// idle_timeout closes a connection that's been idle in this client's local
// pool for N seconds, so a warm serverless instance (Fluid Compute keeps
// these around between requests, see docs/VERCEL-BEST-PRACTICES.md) never
// reuses a connection that's gone stale/been reset upstream while sitting
// idle. Without this, postgres.js defaults to idle_timeout: 0 (never closes
// idle connections), which is what caused intermittent 30s
// FUNCTION_INVOCATION_TIMEOUTs across /admin, /admin/board, and /feed after a
// few idle minutes (handoff 074) -- confirmed against Supabase Postgres logs
// showing "unexpected EOF on client connection with an open transaction" /
// "connection reset by peer" timed to the same windows. connect_timeout
// fails a stuck initial connection fast instead of silently eating into the
// 30s function budget.
const client = postgres(connectionString, {
  prepare: false,
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export * from './schema';
