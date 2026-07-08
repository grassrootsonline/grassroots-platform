# Fix: profile page shows the whole feed instead of just that user's posts

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/profile-posts-filter-by-author` |
| **Depends on** | `059` (needs real `getFeedPosts()` — already landed) |

---

## Problem

Caught by the implementing agent while wrapping up 059/060, correctly not fixed inline since neither handoff listed this file as in-scope — flagging it plainly as my own gap, not a missed instruction on Claude Code's part.

`apps/web/src/app/(platform)/profile/[username]/page.tsx` has had this line since the profile page was first built:

```ts
const [initialPosts, projects, sidebarProjects] = await Promise.all([
  client.getFeedPosts(), // TODO: filter by author once posts schema exists
  client.getProfileProjects(username),
  client.getUserProjects(),
])
```

This was harmless while `getFeedPosts()` was stubbed to return `[]` — the TODO just meant "posts tab is empty," same as everything else pre-059. Now that `getFeedPosts()` returns real, unfiltered, all-authors posts (per 059's explicit design — that's correct behavior for the main feed), this same call on the profile page means **any user's "Posts" tab now shows the entire platform feed**, not their own posts. This is live and visible the moment 059/060 are deployed — worth treating as a fast-follow, not backlog.

---

## Affected files

- `apps/web/src/lib/data/types.ts` — add `getUserPosts(username: string): Promise<FeedPost[]>` to `DataClient`
- `apps/web/src/lib/data/supabase-client.ts` — implement it
- `apps/web/src/lib/data/seed-client.ts` — implement it against `MOCK_POSTS`
- `apps/web/src/app/(platform)/profile/[username]/page.tsx` — call the new method instead of `getFeedPosts()`

---

## Implementation steps

### 1. Add `getUserPosts` to the `DataClient` interface

Mirrors the existing `getProfileProjects(username)` shape (a profile-scoped counterpart to a feed-scoped method) rather than overloading `getFeedPosts()` with an optional filter param — keeps each method's contract single-purpose, consistent with the rest of the interface:

```ts
export interface DataClient {
  // ...existing methods
  getUserPosts(username: string): Promise<FeedPost[]>
}
```

### 2. Implement in `supabase-client.ts`

Reuse whatever query/mapper approach 059 actually landed with for `getFeedPosts()` (join pattern, `toFeedPost` mapper name, etc. — read the current file rather than assuming it matches the handoff draft verbatim), just scoped to one author and without the 50-row feed cap:

```ts
async getUserPosts(username: string): Promise<FeedPost[]> {
  const author = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.username, username),
    columns: { id: true },
  })
  if (!author) return []

  const rows = await db.query.posts.findMany({
    where: (p, { eq, and, isNull }) => and(eq(p.authorId, author.id), isNull(p.deletedAt)),
    orderBy: (p, { desc }) => desc(p.createdAt),
    with: { author: true }, // same relation/join approach as getFeedPosts
  })

  const currentUser = await this.getCurrentUser()
  const likedPostIds = currentUser ? await getLikedPostIds(currentUser.id, rows.map(r => r.id)) : new Set<string>()
  return rows.map((r) => toFeedPost(r, likedPostIds))
}
```

### 3. Implement in `seed-client.ts`

```ts
async getUserPosts(username: string): Promise<FeedPost[]> {
  return MOCK_POSTS.filter((p) => p.author.username === username)
}
```

### 4. Update the profile page call site

```ts
const [initialPosts, projects, sidebarProjects] = await Promise.all([
  client.getUserPosts(username),
  client.getProfileProjects(username),
  client.getUserProjects(),
])
```

---

## Verification

- [ ] Visiting `/profile/[username]` for any user shows only that user's own posts under the "Posts" tab, not the full feed.
- [ ] A user with zero posts sees an empty state on their profile's Posts tab (check `ProfileView` already handles an empty `initialPosts` array reasonably — it should, since this was already the behavior pre-059).
- [ ] `/feed` itself is unaffected — still all posts, reverse-chronological.
- [ ] `pnpm type-check` passes.
