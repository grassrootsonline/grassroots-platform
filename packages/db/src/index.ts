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
// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false, max: 1 });

export const db = drizzle(client, { schema });

export * from './schema';
