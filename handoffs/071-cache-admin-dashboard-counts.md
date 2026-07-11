# Cache admin dashboard aggregate counts

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `perf` |
| **Branch** | `perf/cache-admin-dashboard-counts` |
| **Depends on** | `070` (Redis client/key helpers must exist first) |

---

## Problem

`admin/page.tsx` (the `/admin` dashboard) runs four separate aggregate queries on every load — new-signups count, career-interest-signup count, open-postings count, and a `GROUP BY account_status` breakdown — none of which need to be fresh to the second. This is the lowest-risk piece of the caching plan: pure reads, no write path in this handoff to get wrong, and staleness of a few seconds on a stat card is a non-issue (compare to identity/admin-gate caching in 070, where staleness is a real correctness risk).

---

## Affected files

- `apps/web/src/app/admin/page.tsx` — cache the four dashboard queries
- `apps/web/src/app/admin/users/page.tsx` — cache the user list query

---

## Implementation steps

### 1. `apps/web/src/app/admin/page.tsx`

Wrap the whole result in a single cache entry rather than four separate keys — it's already fetched together via `Promise.all`, and the dashboard has no per-filter variation, so one key is simpler and avoids four round-trips to Redis instead of one:

```ts
import { cacheGet, cacheSet } from '@/lib/redis/client'

const DASHBOARD_CACHE_KEY = 'admin:dashboard:stats'

interface DashboardStats {
  newSignups: number
  talentSignups: number
  openPostings: number
  statusCounts: Record<string, number>
}

export default async function AdminDashboardPage() {
  let stats = await cacheGet<DashboardStats>(DASHBOARD_CACHE_KEY)

  if (!stats) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [[newSignups], [talentSignups], [openPostings], statusRows] = await Promise.all([
      db.select({ n: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
      db.select({ n: count() }).from(careerInterestSignups),
      db.select({ n: count() }).from(jobPostings).where(eq(jobPostings.status, 'published')),
      db.select({ status: users.accountStatus, n: count() }).from(users).groupBy(users.accountStatus),
    ])

    const statusCounts: Record<string, number> = { waitlisted: 0, active: 0, suspended: 0 }
    for (const row of statusRows) statusCounts[row.status] = row.n

    stats = { newSignups: newSignups.n, talentSignups: talentSignups.n, openPostings: openPostings.n, statusCounts }
    await cacheSet(DASHBOARD_CACHE_KEY, stats, 30) // 30s — a dashboard stat card lagging by half a minute is fine
  }

  const totalUsers = Object.values(stats.statusCounts).reduce((a, b) => a + b, 0)
  // ...rest of the render unchanged, reading from `stats` instead of the individual variables
}
```

No invalidation wired here deliberately — a 30s TTL alone is the right tool for a dashboard (unlike 070's identity cache, there's no specific user-facing bug this staleness could cause; Alex glancing at a stat card that's 20 seconds old is a non-event). Don't over-engineer this with cache-busting on every user signup/status change.

Commit: `perf(admin): cache dashboard aggregate stats in Redis`

### 2. `apps/web/src/app/admin/users/page.tsx`

Cache the user list **per filter value** (the page supports `?status=` filtering), since each filter is a genuinely different query result:

```ts
import { cacheGet, cacheSet } from '@/lib/redis/client'

// ...inside the page component, after resolving `filter`
const cacheKey = `admin:users:${filter ?? 'all'}`
let rows = await cacheGet<UserRow[]>(cacheKey)
if (!rows) {
  rows = await db.select({ /* ...unchanged... */ }).from(users) /* ...unchanged... */
  await cacheSet(cacheKey, rows, 20) // shorter than the dashboard — this list drives the activate/suspend workflow, keep it fresher
}
```

Note the interaction with 070: `setAccountStatusAction` (070, step 6) already busts the **session** cache on a status change, but it does **not** bust this list-view cache — that's an intentional, small gap, not an oversight. A 20s TTL means the admin users list can show a just-changed status for up to 20 seconds after Alex clicks "Activate," even though the change itself (070's `session:` cache invalidation) has already taken effect for the affected user. If this proves annoying in practice, the fix is for `setAccountStatusAction` to also call `cacheDel` on every `admin:users:*` key variant (or switch this list to `revalidatePath`-only, no Redis cache, since it's a low-traffic admin-only page and the caching value here is genuinely marginal) — flag this tradeoff in your completion report rather than silently adding more invalidation complexity than this low-stakes page needs.

Commit: `perf(admin): cache users list query in Redis, per status filter`

---

## Verification

- [ ] `/admin` dashboard renders identical stats to before, just faster on a cache hit (check response time difference, or temporarily log cache hit/miss).
- [ ] `/admin/users` and each `?status=` filter variant render correctly and cache independently (switching filters doesn't show stale data from a different filter).
- [ ] Confirm the known, intentional staleness window from step 2's note is acceptable to Alex — mention it in the completion report rather than assuming.
- [ ] `pnpm type-check` passes.
