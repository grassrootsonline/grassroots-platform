# Social schema + Server Actions: posts, reactions, comments, follows, notifications

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feature` |
| **Branch** | `feat/social-schema-post-actions` |
| **Depends on** | none |

---

## Problem

Alex wants the feed live: "I'd like to be able to see some posts and interact with users that I let into the project." The frontend is already fully built and wired to `DataClient` — `getFeedPosts`, `getPost`, `getThreadReplies`, `getWhoToFollow`, `getNotifications` all exist on the interface (`apps/web/src/lib/data/types.ts`) and are called from real Server Components (`feed/page.tsx`, `feed/[postId]/page.tsx`, `profile/[username]/page.tsx`, `(platform)/layout.tsx`), but `SupabaseDataClient` currently stubs every one of them to return `[]`/`null` because there's no posts/social schema yet:

```ts
// apps/web/src/lib/data/supabase-client.ts (current)
async getFeedPosts(): Promise<FeedPost[]> { return [] }
async getPost(_postId: string): Promise<FeedPost | null> { return null }
async getWhoToFollow(): Promise<SuggestedUser[]> { return [] }
async getThreadReplies(_postId: string): Promise<Reply[]> { return [] }
async getNotifications(): Promise<AppNotification[]> { return [] }
```

`FeedCard`, `ComposerModal`, `ThreadView`, `ProfileView` are all real, already-built components — but every interaction (like, publish, reply, follow) is local-only `useState`, nothing persists or is visible to other users. This handoff builds the missing backend: schema, RLS, `requireSession`, and the Server Actions. **Handoff 060 wires the UI to it** — don't do UI work here, this is schema + actions + `DataClient` only.

**Scope decision, confirmed with Alex:** the feed is **all posts, reverse-chronological** for v1 — not filtered to a following graph. `getFeedPosts()` should simply return all non-deleted posts newest-first; there is no feed-ranking or graph-traversal logic to build here.

**Explicitly out of scope:** `posts.project_id` / `posts.community_id`. `ROADMAP.md`'s full schema sketch includes these, but there are no `projects`/`communities` tables yet — `getUserProjects()` and `getTrendingProjects()` are still stubbed to `[]` today and this handoff doesn't change that. `ComposerModal`'s project `<select>` will keep showing "No project" as the only option until a projects schema lands; that's already true today, not a regression. Don't add FK columns pointing at tables that don't exist.

---

## Affected files

- `packages/db/src/schema.ts` — add `posts`, `postReactions`, `comments`, `follows`, `notifications` tables + `notificationTypeEnum`
- `supabase/migrations/<timestamp>_social_schema.sql` — new migration (see handoff 053's lesson: this must actually be applied via the Supabase MCP / tracked migration flow, not just written and forgotten — confirm it lands on production, not just committed to the repo)
- `apps/web/src/lib/auth/require-session.ts` — new
- `apps/web/src/actions/posts.actions.ts` — new
- `apps/web/src/actions/follows.actions.ts` — new
- `apps/web/src/lib/data/types.ts` — no interface changes needed (already matches what's below), but double check `FeedPost`/`Reply`/`AppNotification`/`SuggestedUser` shapes while wiring the mappers
- `apps/web/src/lib/data/supabase-client.ts` — replace the six stubbed methods with real implementations
- `apps/web/src/lib/data/seed-client.ts` — wire the same six methods to `MOCK_POSTS`/`MOCK_REPLIES`/`MOCK_NOTIFICATIONS`/`MOCK_WHO_TO_FOLLOW` from `lib/mock-data.ts` (confirm this file already does this for seed mode — if it's also stubbed, fix it here too, seeded dev builds need working posts as much as production does)

---

## Schema

Follow the exact conventions already in `packages/db/src/schema.ts` (aligned column comments, `uuid().primaryKey().defaultRandom()`, `withTimezone: true` timestamps, `onDelete: 'cascade'` on child FKs).

```ts
export const posts = pgTable('posts', {
  id:            uuid('id').primaryKey().defaultRandom(),
  authorId:      uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content:       text('content').notNull(),
  reactionCount: integer('reaction_count').notNull().default(0),
  commentCount:  integer('comment_count').notNull().default(0),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:     timestamp('deleted_at', { withTimezone: true }), // soft delete, same pattern as `users.deletedAt`
});

export const postReactions = pgTable('post_reactions', {
  id:        uuid('id').primaryKey().defaultRandom(),
  postId:    uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqReaction: unique('post_reactions_post_user_unique').on(table.postId, table.userId),
}));

export const comments = pgTable('comments', {
  id:            uuid('id').primaryKey().defaultRandom(),
  postId:        uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId:      uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content:       text('content').notNull(),
  reactionCount: integer('reaction_count').notNull().default(0),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
// v1 is a flat reply list (matches ThreadView's rendering — no nested replies), so no parentCommentId.

export const follows = pgTable('follows', {
  id:          uuid('id').primaryKey().defaultRandom(),
  followerId:  uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqFollow: unique('follows_follower_following_unique').on(table.followerId, table.followingId),
}));
// Enforce follower_id != following_id in the Server Action, not a DB CHECK constraint —
// simpler, and the only write path is the action.

export const notificationTypeEnum = pgEnum('notification_type', ['reaction', 'comment', 'follow']);

export const notifications = pgTable('notifications', {
  id:          uuid('id').primaryKey().defaultRandom(),
  recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorId:     uuid('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:        notificationTypeEnum('type').notNull(),
  postId:      uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }), // null for 'follow'
  read:        boolean('read').notNull().default(false),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

Add an index on `posts.createdAt` (descending feed query), `notifications.recipientId` (per-user notification fetch), and `follows.followerId` / `follows.followingId` (both directions are queried — followers list and following list).

---

## RLS — get this right the first time

Two RLS mistakes have already shipped this project (`users.account_status` in handoff 054, `admin_users` in handoff 058) — both from writing a migration that didn't match how the table is actually read. Read `apps/web/src/lib/data/supabase-client.ts` before writing policies: it reads through **Drizzle with the service-role connection** (`db` from `@grassroots/db`), which bypasses RLS entirely — so these policies are a defense-in-depth / future-anon-read-path measure, not something the current `DataClient` code depends on to function. Enable RLS and write real policies anyway (matches the platform-wide "always on" convention from handoff 054), but there's no live anon-key read path for these five tables today to test against — don't skip enabling RLS just because nothing will immediately break without it.

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_all" ON posts FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "posts_insert_own" ON posts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = posts.author_id AND users.auth_id = auth.uid())
);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = posts.author_id AND users.auth_id = auth.uid())
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_reactions_select_all" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "post_reactions_insert_own" ON post_reactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = post_reactions.user_id AND users.auth_id = auth.uid())
);
CREATE POLICY "post_reactions_delete_own" ON post_reactions FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = post_reactions.user_id AND users.auth_id = auth.uid())
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select_all" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON comments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = comments.author_id AND users.auth_id = auth.uid())
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select_all" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON follows FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = follows.follower_id AND users.auth_id = auth.uid())
);
CREATE POLICY "follows_delete_own" ON follows FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = follows.follower_id AND users.auth_id = auth.uid())
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = notifications.recipient_id AND users.auth_id = auth.uid())
);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = notifications.recipient_id AND users.auth_id = auth.uid())
);
```

Apply this migration to **both production and staging** (staging is stale/paused per the separate staging investigation, but keep its schema from drifting further — see the staging notes in project memory. Don't attempt to fix staging's deployment issue as part of this handoff, just don't let its schema fall further behind).

---

## `requireSession` helper

Every Server Action below needs "is there a logged-in, active-status user" — a broader check than `requireAdmin` (which additionally checks `admin_users`). No such helper exists yet; add one following the exact same shape as `requireAdmin` (`apps/web/src/lib/auth/require-admin.ts`):

```ts
// apps/web/src/lib/auth/require-session.ts
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@grassroots/db';

export async function requireSession(): Promise<{ userId: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const profile = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.authId, user.id),
    columns: { id: true, accountStatus: true },
  });
  if (!profile) throw new Error('Not authenticated');
  if (profile.accountStatus !== 'active') throw new Error('Account not active');

  return { userId: profile.id };
}
```

The `accountStatus !== 'active'` check matters even though middleware already gates `/feed`/`/profile`/etc. to active users — Server Actions are a separate trust boundary (a stale client bundle, a direct fetch to the action's endpoint, or a session that went stale between page load and form submit could all bypass the middleware check). Same "server check as an independent layer" principle as `requireAdmin`'s comment already documents.

---

## Server Actions

### `apps/web/src/actions/posts.actions.ts`

```ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@grassroots/db';
import { posts, postReactions, comments, notifications, users } from '@grassroots/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireSession } from '@/lib/auth/require-session';

const ContentSchema = z.string().trim().min(1, 'Say something first.').max(2000, 'Keep it under 2000 characters.');

export async function createPostAction(content: string): Promise<{ id: string; createdAt: string } | { error: string }> {
  const { userId } = await requireSession();
  const parsed = ContentSchema.safeParse(content);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [inserted] = await db.insert(posts).values({
    authorId: userId,
    content: parsed.data,
  }).returning({ id: posts.id, createdAt: posts.createdAt });

  await db.update(users).set({ postCount: sql`${users.postCount} + 1` }).where(eq(users.id, userId));

  revalidatePath('/feed');
  return { id: inserted.id, createdAt: inserted.createdAt.toISOString() };
}

export async function reactToPostAction(postId: string): Promise<{ liked: boolean; reactionCount: number } | { error: string }> {
  const { userId } = await requireSession();

  const existing = await db.query.postReactions.findFirst({
    where: and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)),
  });

  if (existing) {
    await db.delete(postReactions).where(eq(postReactions.id, existing.id));
    const [row] = await db.update(posts)
      .set({ reactionCount: sql`${posts.reactionCount} - 1` })
      .where(eq(posts.id, postId))
      .returning({ reactionCount: posts.reactionCount });
    revalidatePath('/feed');
    revalidatePath(`/feed/${postId}`);
    return { liked: false, reactionCount: row?.reactionCount ?? 0 };
  }

  await db.insert(postReactions).values({ postId, userId });
  const [row] = await db.update(posts)
    .set({ reactionCount: sql`${posts.reactionCount} + 1` })
    .where(eq(posts.id, postId))
    .returning({ reactionCount: posts.reactionCount, authorId: posts.authorId });

  // Don't notify on self-like.
  if (row && row.authorId !== userId) {
    await db.insert(notifications).values({
      recipientId: row.authorId, actorId: userId, type: 'reaction', postId,
    });
  }

  revalidatePath('/feed');
  revalidatePath(`/feed/${postId}`);
  return { liked: true, reactionCount: row?.reactionCount ?? 0 };
}

export async function createCommentAction(
  postId: string,
  content: string
): Promise<{ id: string; createdAt: string } | { error: string }> {
  const { userId } = await requireSession();
  const parsed = ContentSchema.safeParse(content);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [inserted] = await db.insert(comments).values({
    postId, authorId: userId, content: parsed.data,
  }).returning({ id: comments.id, createdAt: comments.createdAt });

  const [postRow] = await db.update(posts)
    .set({ commentCount: sql`${posts.commentCount} + 1` })
    .where(eq(posts.id, postId))
    .returning({ authorId: posts.authorId });

  if (postRow && postRow.authorId !== userId) {
    await db.insert(notifications).values({
      recipientId: postRow.authorId, actorId: userId, type: 'comment', postId,
    });
  }

  revalidatePath(`/feed/${postId}`);
  return { id: inserted.id, createdAt: inserted.createdAt.toISOString() };
}
```

**Note on shape:** these return typed results rather than the `useActionState`/`FormData` pattern used by `admin-careers.actions.ts` and the auth forms — deliberately, because the calling components (`ComposerModal`, `FeedCard`'s like button, `ThreadView`'s reply box) are already-built, bespoke optimistic-UI client components, not `<form>`-driven pages. Handoff 060 covers exactly how each one calls these. Don't retrofit `useActionState` onto them — that would mean rebuilding UI that already works well, for no benefit.

### `apps/web/src/actions/follows.actions.ts`

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@grassroots/db';
import { follows, users, notifications } from '@grassroots/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireSession } from '@/lib/auth/require-session';

export async function followUserAction(targetUserId: string): Promise<{ following: boolean } | { error: string }> {
  const { userId } = await requireSession();
  if (userId === targetUserId) return { error: "You can't follow yourself." };

  const existing = await db.query.follows.findFirst({
    where: and(eq(follows.followerId, userId), eq(follows.followingId, targetUserId)),
  });

  if (existing) {
    await db.delete(follows).where(eq(follows.id, existing.id));
    await db.update(users).set({ followingCount: sql`${users.followingCount} - 1` }).where(eq(users.id, userId));
    await db.update(users).set({ followerCount: sql`${users.followerCount} - 1` }).where(eq(users.id, targetUserId));
    revalidatePath('/feed');
    return { following: false };
  }

  await db.insert(follows).values({ followerId: userId, followingId: targetUserId });
  await db.update(users).set({ followingCount: sql`${users.followingCount} + 1` }).where(eq(users.id, userId));
  await db.update(users).set({ followerCount: sql`${users.followerCount} + 1` }).where(eq(users.id, targetUserId));
  await db.insert(notifications).values({ recipientId: targetUserId, actorId: userId, type: 'follow' });

  revalidatePath('/feed');
  return { following: true };
}
```

Both files run each multi-statement sequence as a single logical unit — if the project's Drizzle setup has a `db.transaction()` helper already in use elsewhere (check `packages/db/src/index.ts` / other action files for precedent), wrap the delete/update pairs in a transaction rather than sequential awaits, so a mid-sequence failure can't leave counts out of sync. If no transaction helper exists yet, sequential awaits are acceptable for v1 but flag this as a known gap in your completion report.

---

## `DataClient` implementations

Replace the stubs in `apps/web/src/lib/data/supabase-client.ts`:

```ts
async getFeedPosts(): Promise<FeedPost[]> {
  const rows = await db.query.posts.findMany({
    where: (p, { isNull }) => isNull(p.deletedAt),
    orderBy: (p, { desc }) => desc(p.createdAt),
    limit: 50, // simple v1 cap — no pagination yet, matches feed-view's non-paginated rendering
    with: { author: true }, // adjust to however Drizzle relations are declared elsewhere in this file, or do a manual join if relations aren't set up yet
  })
  const currentUser = await this.getCurrentUser()
  const likedPostIds = currentUser ? await getLikedPostIds(currentUser.id, rows.map(r => r.id)) : new Set<string>()
  return rows.map((r) => toFeedPost(r, likedPostIds))
}

async getPost(postId: string): Promise<FeedPost | null> {
  const row = await db.query.posts.findFirst({
    where: (p, { eq, isNull, and }) => and(eq(p.id, postId), isNull(p.deletedAt)),
    with: { author: true },
  })
  if (!row) return null
  const currentUser = await this.getCurrentUser()
  const likedPostIds = currentUser ? await getLikedPostIds(currentUser.id, [row.id]) : new Set<string>()
  return toFeedPost(row, likedPostIds)
}

async getThreadReplies(postId: string): Promise<Reply[]> {
  const rows = await db.query.comments.findMany({
    where: (c, { eq }) => eq(c.postId, postId),
    orderBy: (c, { asc }) => asc(c.createdAt),
    with: { author: true },
  })
  return rows.map(toReply)
}

async getWhoToFollow(): Promise<SuggestedUser[]> {
  const currentUser = await this.getCurrentUser()
  // Simplest v1: most recently active users, excluding self and anyone already followed.
  // No "mutual interest" ranking — that needs real usage data this platform doesn't have yet.
  const rows = await db.query.users.findMany({
    where: (u, { and, eq, ne }) => and(eq(u.accountStatus, 'active'), currentUser ? ne(u.id, currentUser.id) : undefined),
    orderBy: (u, { desc }) => desc(u.createdAt),
    limit: 5,
  })
  const alreadyFollowing = currentUser ? await getFollowingIds(currentUser.id) : new Set<string>()
  return rows.filter(r => !alreadyFollowing.has(r.id)).map(toSuggestedUser)
}

async getNotifications(): Promise<AppNotification[]> {
  const currentUser = await this.getCurrentUser()
  if (!currentUser) return []
  const rows = await db.query.notifications.findMany({
    where: (n, { eq }) => eq(n.recipientId, currentUser.id),
    orderBy: (n, { desc }) => desc(n.createdAt),
    limit: 20,
    with: { actor: true },
  })
  return rows.map(toAppNotification)
}
```

You'll need small mapper helpers (`toFeedPost`, `toReply`, `toSuggestedUser`, `toAppNotification`, `getLikedPostIds`, `getFollowingIds`) — write these to match the exact interfaces in `lib/data/types.ts` (already quoted in full above in Problem — `FeedPost.project`/`.community` should map to `null` since there's no schema for either yet; `SuggestedUser.tagline` should map from `user_profiles.headline`, falling back to something reasonable like `'Building on Grassroots'` if null, since `tagline` isn't optional in the interface). Use your judgment on exact Drizzle relation syntax based on whether relations are already declared in `packages/db/src/schema.ts` (they don't appear to be, based on the current file — you may need `db.select().from(posts).innerJoin(users, ...)` manual joins instead of `db.query.posts.findMany({ with: { author: true } })`; check what pattern the rest of the file already uses and stay consistent).

Wire the same six methods in `apps/web/src/lib/data/seed-client.ts` against `MOCK_POSTS`/`MOCK_REPLIES`/`MOCK_NOTIFICATIONS`/`MOCK_WHO_TO_FOLLOW` from `lib/mock-data.ts` if they aren't already — seeded/dev builds should show working posts too, per `CLAUDE.md`'s data-layer contract.

---

## Verification

- [ ] Migration applies cleanly to both production and staging via the tracked Supabase migration flow (not a one-off dashboard SQL run — see handoff 053's lesson about untracked changes).
- [ ] `get_advisors` (security) on both projects shows no RLS gaps on the five new tables after this lands.
- [ ] `createPostAction` inserts a row, increments `users.post_count`, and the new post is visible via `getFeedPosts()` immediately after (no caching lag).
- [ ] `reactToPostAction` toggles correctly both directions, count never goes negative, no self-notification.
- [ ] `createCommentAction` inserts and increments `posts.comment_count`; author gets a notification unless replying to their own post.
- [ ] `followUserAction` toggles correctly, updates both users' counts, rejects self-follow with a clear error, notifies on follow (not unfollow).
- [ ] `getFeedPosts()` returns real posts newest-first, capped at 50, only through `DataClient` — no direct Drizzle calls leak into page components.
- [ ] `pnpm type-check` passes.
