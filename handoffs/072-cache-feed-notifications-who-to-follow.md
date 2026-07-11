# Cache feed, notifications, and who-to-follow reads with write-path invalidation

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `perf` |
| **Branch** | `perf/cache-feed-notifications` |
| **Depends on** | `070` (Redis client/key helpers), `059`/`060` (posts/reactions/follows schema and actions) |

---

## Problem

`getFeedPosts()`, `getNotifications()`, and `getWhoToFollow()` each run a full join query on every call, and (before handoff 069) each independently re-resolved `getCurrentUser()` too. This is the most involved piece of the caching plan because, unlike 071's dashboard counts, these have real write paths (posts, reactions, comments, follows) that should keep the cache reasonably fresh — but they're also genuinely different from the identity caching in 070, where staleness is a correctness bug. Nobody's account access breaks if a reaction count is 20 seconds stale; explicit design tradeoffs below reflect that difference in stakes.

**Deliberately not building:** `ROADMAP.md`'s original sketch for this includes a "hybrid fan-out" model (push-on-write feed caches per-follower below a 10,000-follower threshold, pull-at-read above it) and a Vercel Cron job pre-warming caches for the "top 1,000 most active users." Both are real Phase-3-scale designs for a platform with thousands of active users and a following-filtered feed. This platform has **two real users** and an explicitly all-posts (not following-filtered) feed for v1 (confirmed with Alex when the feed shipped, handoff 059). Building fan-out/warming infrastructure now would be pure speculative complexity — skip it. If/when the feed becomes following-filtered and the user base grows, that's a distinct future handoff, not part of this one.

---

## Affected files

- `apps/web/src/lib/data/supabase-client.ts` — cache `getFeedPosts()`, `getNotifications()`, `getWhoToFollow()`
- `apps/web/src/lib/redis/keys.ts` — add key helpers for these three
- `apps/web/src/actions/posts.actions.ts` — invalidate on `createPostAction`, `createCommentAction`; invalidate the recipient's notification cache on `reactToPostAction`, `createCommentAction`
- `apps/web/src/actions/follows.actions.ts` — invalidate the actor's who-to-follow cache and the target's notification cache on `followUserAction`

---

## Design: what's cached globally vs. per-viewer

- **Feed posts list** — cached **globally** (one key, not per-user). The post content, author, and counts are the same for every viewer; only `likedByMe` differs per viewer, and that's cheap to compute fresh (a single indexed `post_reactions` lookup by `(userId, postIds)`, already factored out as `getLikedPostIds()`). Caching the shared part and overlaying the per-viewer part avoids an explosion of per-user cache entries for data that's 95% identical across viewers.
- **Notifications** — cached **per-recipient** (`notif:{userId}`) — genuinely different data per user, no shared part to extract.
- **Who-to-follow** — cached **per-viewer** (`whotofollow:{userId}`) — the exclusion list (self + already-following) makes this genuinely per-user too, and the result set is small enough that per-user caching isn't wasteful the way it would be for the full feed.

Add to `apps/web/src/lib/redis/keys.ts`:

```ts
export const feedPostsKey = () => 'feed:posts'
export const notificationsKey = (userId: string) => `notif:${userId}`
export const whoToFollowKey = (userId: string) => `whotofollow:${userId}`
```

---

## Implementation steps

### 1. `getFeedPosts()` — cache the shared list, overlay `likedByMe` live

```ts
import { cacheGet, cacheSet } from '@/lib/redis/client'
import { feedPostsKey } from '@/lib/redis/keys'

async getFeedPosts(): Promise<FeedPost[]> {
  type CachedPost = Omit<FeedPost, 'likedByMe'>

  let basePosts = await cacheGet<CachedPost[]>(feedPostsKey())
  if (!basePosts) {
    const rows = await db
      .select({ post: posts, user: users, profile: userProfiles })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(isNull(posts.deletedAt))
      .orderBy(desc(posts.createdAt))
      .limit(50)

    basePosts = rows.map((r) => toFeedPost(r.post, r.user, r.profile, new Set())) // likedByMe always false here — overlaid below
    // 30s — reaction/comment counts baked into this cached payload can lag by
    // up to 30s for viewers other than the one who just acted (the acting
    // user's own client already shows the correct count optimistically, per
    // handoff 060). This is an accepted tradeoff, not an oversight — see
    // Problem section. Invalidated immediately on new posts (step 3), not on
    // every reaction, since reactions are far more frequent and invalidating
    // on each one would defeat most of the cache's value.
    await cacheSet(feedPostsKey(), basePosts, 30)
  }

  const currentUser = await this.getCurrentUser()
  const likedPostIds = currentUser
    ? await getLikedPostIds(currentUser.id, basePosts.map((p) => p.id))
    : new Set<string>()

  return basePosts.map((p) => ({ ...p, likedByMe: likedPostIds.has(p.id) }))
}
```

`getUserPosts(username)` (handoff 062) and `getPost(postId)` are **not** cached in this handoff — they're single-author or single-post lookups, lower traffic than the main feed, and less clearly worth the added complexity. Revisit only if they show up as a real load contributor later.

Commit: `perf(data): cache feed posts list, overlay per-viewer like state`

### 2. `getNotifications()` and `getWhoToFollow()` — straightforward per-user caching

```ts
async getNotifications(): Promise<AppNotification[]> {
  const currentUser = await this.getCurrentUser()
  if (!currentUser) return []

  const cached = await cacheGet<AppNotification[]>(notificationsKey(currentUser.id))
  if (cached) return cached

  const rows = await db /* ...unchanged query... */
  const result = rows.map((r) => toAppNotification(r.notification, r.actor, r.profile))
  await cacheSet(notificationsKey(currentUser.id), result, 30)
  return result
}
```

Same pattern for `getWhoToFollow()`, keyed by `whoToFollowKey(currentUser.id)`, TTL 60s (lower-stakes suggestion list, can lag a bit more than notifications).

Commit: `perf(data): cache notifications and who-to-follow per user`

### 3. Invalidation — `posts.actions.ts`

```ts
import { cacheDel } from '@/lib/redis/client'
import { feedPostsKey, notificationsKey } from '@/lib/redis/keys'

export async function createPostAction(content: string) {
  // ...existing insert logic...
  await cacheDel(feedPostsKey())
  return { id: inserted.id, createdAt: inserted.createdAt.toISOString() }
}
```

`reactToPostAction` does **not** invalidate `feedPostsKey()` (see the 30s-lag tradeoff above) but **does** invalidate the post author's notification cache, since a new notification is a discrete, less-frequent event per recipient and staleness there is more noticeable ("I got a like but my bell doesn't show it"):

```ts
if (row && row.authorId !== userId) {
  await db.insert(notifications).values({ recipientId: row.authorId, actorId: userId, type: 'reaction', postId })
  await cacheDel(notificationsKey(row.authorId))
}
```

`createCommentAction` invalidates **both** `feedPostsKey()` (a new comment changes `commentCount`, which is more visible/expected to update than a reaction count) and the post author's notification cache:

```ts
await cacheDel(feedPostsKey())
if (postRow && postRow.authorId !== userId) {
  await db.insert(notifications).values({ recipientId: postRow.authorId, actorId: userId, type: 'comment', postId })
  await cacheDel(notificationsKey(postRow.authorId))
}
```

Commit: `fix(posts): invalidate feed/notification caches on write`

### 4. Invalidation — `follows.actions.ts`

`followUserAction` invalidates the **acting user's** who-to-follow cache (they just changed who they're following, so their own suggestion list should reflect it on next load) and the **target's** notification cache (on follow only, not unfollow — matches the existing "notify on follow, not unfollow" behavior from handoff 059):

```ts
import { cacheDel } from '@/lib/redis/client'
import { whoToFollowKey, notificationsKey } from '@/lib/redis/keys'

// after a successful follow (not unfollow):
await db.insert(notifications).values({ recipientId: targetUserId, actorId: userId, type: 'follow' })
await cacheDel(notificationsKey(targetUserId))
await cacheDel(whoToFollowKey(userId))
```

Commit: `fix(follows): invalidate who-to-follow/notification caches on follow`

---

## Verification

- [ ] Publishing a post appears in the feed for every viewer immediately (not after a 30s wait) — this exercises the `createPostAction` invalidation.
- [ ] Liking a post: the acting user sees the count update instantly (client-side optimistic, unchanged from handoff 060); a **different** browser/session may lag up to 30s before seeing the new count — confirm this is the accepted behavior, not a bug, before signing off.
- [ ] Commenting on a post updates the feed's comment count for all viewers promptly (not gated behind the 30s reaction-lag tradeoff, since this path explicitly invalidates).
- [ ] A new reaction/comment/follow notification appears in the recipient's bell without needing a hard refresh beyond the next natural page navigation.
- [ ] Following someone updates your own "Who to follow" list (they drop off) without a stale reappearance.
- [ ] `pnpm type-check` passes.
- [ ] Confirm in the completion report that no fan-out/cache-warming infrastructure was added — this handoff is deliberately scoped below that complexity.
