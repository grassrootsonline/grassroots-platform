import { Redis } from '@upstash/redis'

// The Upstash integration provisioned on this project (Vercel Marketplace ->
// Upstash) lands as KV_REST_API_URL / KV_REST_API_TOKEN, not the
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN names Upstash's own docs
// default to -- confirmed against the actual env vars set in the Vercel
// dashboard for this project (production + preview). Same REST API either way.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Every call site MUST use this wrapper, never the raw client directly — it
// guarantees the fail-open behavior described in handoff 070's Problem
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
