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
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false, max: 3 });

export const db = drizzle(client, { schema });

export * from './schema';
