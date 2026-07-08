# Wire feed, thread, profile, composer, and notifications to real Server Actions

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feature` |
| **Branch** | `feat/wire-feed-to-real-actions` |
| **Depends on** | `059` (schema + Server Actions must land first) |

---

## Problem

Handoff 059 builds the real backend. This handoff replaces every local-only `useState` interaction in the already-built feed UI with calls to it, so posts/likes/replies/follows actually persist and become visible to other real users Alex has activated. Every component named below already exists and already renders correctly against seed/mock data — this is backend wiring, not new UI construction. Don't rebuild any of these components from scratch; find the exact `useState` calls described below and replace them.

---

## Affected files

- `apps/web/src/components/feed/feed-card.tsx` — add `onReact` prop
- `apps/web/src/components/feed/composer-modal.tsx` — `onPublish` becomes async
- `apps/web/src/app/(platform)/feed/feed-view.tsx` — `handlePublish`, follow toggles, wire `onReact`
- `apps/web/src/app/(platform)/feed/[postId]/thread-view.tsx` — `handleReply`, wire `onReact` on the embedded `FeedCard`, reply likes
- `apps/web/src/app/(platform)/profile/[username]/profile-view.tsx` — wire the "Follow" button (currently static, no handler at all)

---

## Implementation steps

### 1. `FeedCard` — add an optional `onReact` prop

Currently (`feed-card.tsx`):

```tsx
interface FeedCardProps {
  post: FeedPost
  onOpenThread?: (postId: string) => void
}

export function FeedCard({ post, onOpenThread }: FeedCardProps) {
  const [liked, setLiked] = useState(post.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(post.reactionCount)
  // ... like button currently just flips `liked`/`likeCount` locally, no callback fired
```

Add an optional `onReact` callback, fired on click, and keep the existing local state as the optimistic layer (don't remove it — it's what makes the like button feel instant):

```tsx
interface FeedCardProps {
  post: FeedPost
  onOpenThread?: (postId: string) => void
  onReact?: (postId: string) => void
}

export function FeedCard({ post, onOpenThread, onReact }: FeedCardProps) {
  const [liked, setLiked] = useState(post.likedByMe ?? false)
  const [likeCount, setLikeCount] = useState(post.reactionCount)

  function handleLikeClick() {
    setLiked((l) => !l)
    setLikeCount((c) => (liked ? c - 1 : c + 1))
    onReact?.(post.id)
  }
  // wire the like button's onClick to handleLikeClick instead of its current inline toggle
```

Making it optional (rather than required) means `ThreadView`'s embedded `FeedCard` and `ProfileView`'s post list don't break if you wire them later than `feed-view.tsx` — but wire all three call sites in this same handoff (see steps 3-5), don't leave any of them silently non-functional.

Commit: `feat(feed): add onReact callback to FeedCard`

### 2. `ComposerModal` — `onPublish` becomes async, with rollback on failure

Currently `onPublish` is synchronous and always "succeeds" locally. Change the prop type and call site to await the real action and surface failure:

```tsx
interface ComposerModalProps {
  open: boolean
  onClose: () => void
  onPublish: (post: { content: string; projectId?: string }) => Promise<void>
  user: { name: string; username: string; avatarUrl?: string | null }
  projects: SidebarProject[]
}
```

```tsx
async function handlePublish() {
  if (!content.trim()) return
  const trimmed = content.trim()
  setContent('')
  setProjectId('')
  onClose()
  try {
    await onPublish({ content: trimmed, projectId: projectId || undefined })
    toast('Post published.')
  } catch {
    toast('Something went wrong publishing your post. Try again.')
    // Deliberately not restoring `content` here — see feed-view.tsx's rollback for how
    // the failed post itself gets removed from the feed instead. Re-opening the composer
    // with the lost text is a nice-to-have, not required for this handoff.
  }
}
```

Commit: `feat(composer): make onPublish async and surface publish failures`

### 3. `feed-view.tsx` — wire publish, reactions, and follow

Replace `handlePublish` to call `createPostAction`, keeping the existing optimistic prepend but reconciling on response and rolling back on error:

```tsx
import { createPostAction, reactToPostAction } from '@/actions/posts.actions'
import { followUserAction } from '@/actions/follows.actions'

async function handlePublish({ content }: { content: string; projectId?: string }) {
  const tempId = `new-${Date.now()}`
  const optimisticPost: FeedPost = {
    id: tempId,
    author: { name: user.name, username: user.username, avatarUrl: user.avatarUrl },
    content,
    createdAt: new Date().toISOString(),
    reactionCount: 0,
    commentCount: 0,
  }
  setPosts((prev) => [optimisticPost, ...prev])

  const result = await createPostAction(content)
  if ('error' in result) {
    setPosts((prev) => prev.filter((p) => p.id !== tempId))
    throw new Error(result.error)
  }
  // Reconcile temp ID with the real one so /feed/[postId] links work.
  setPosts((prev) => prev.map((p) => (p.id === tempId ? { ...p, id: result.id, createdAt: result.createdAt } : p)))
}

function handleReact(postId: string) {
  reactToPostAction(postId).catch(() => {
    toast('Could not update your reaction. Try again.')
    // FeedCard's own local state already flipped optimistically — a full rollback would
    // need lifting like-state up out of FeedCard, which isn't worth it for a rare failure
    // case. A toast + leaving the optimistic state is an acceptable v1 tradeoff; flag this
    // in your completion report rather than over-building a rollback path.
  })
}
```

Note `handlePublish` now throws instead of swallowing errors — that's intentional, so `ComposerModal`'s `try/catch` (step 2) can show the failure toast. Pass `onReact={handleReact}` to each `<FeedCard>` in the map.

For the "Trending projects" and "Who to follow" follow buttons, `toggleFollow(key)` currently just flips local state with no distinction between a project-slug key and a username key — that's fine for "Trending projects" (still stubbed empty, no real projects table, leave as-is per handoff 059's scope note), but "Who to follow" needs to actually call `followUserAction`. Split the single `toggleFollow` into two handlers so the semantics don't get muddled:

```tsx
async function handleFollowUser(username: string, userId: string) {
  setFollowing((f) => ({ ...f, [username]: !f[username] })) // optimistic
  const result = await followUserAction(userId)
  if ('error' in result) {
    setFollowing((f) => ({ ...f, [username]: !f[username] })) // rollback
    toast(result.error)
  }
}
```

This requires `SuggestedUser` to carry an `id` field so the button has something to pass to `followUserAction` — check `lib/data/types.ts`'s `SuggestedUser` interface (currently `{ name, username, tagline, avatarUrl }`, no `id`). Add `id: string` to `SuggestedUser` in `types.ts` and populate it from handoff 059's `getWhoToFollow()` implementation. This is a small, additive interface change — confirm handoff 059 landed with this field before starting this step, and if it didn't, add it here rather than blocking.

Commit: `feat(feed): wire composer, reactions, and follow to real Server Actions`

### 4. `thread-view.tsx` — wire reply and the embedded post's reaction

```tsx
import { createCommentAction, reactToPostAction } from '@/actions/posts.actions'

async function handleReply() {
  if (!replyText.trim()) return
  const trimmed = replyText.trim()
  setReplyText('')

  const optimisticReply: Reply = {
    id: `r-${Date.now()}`,
    author: { name: user.name, username: user.username, avatarUrl: user.avatarUrl },
    content: trimmed,
    createdAt: new Date().toISOString(),
    reactionCount: 0,
  }
  setReplies((prev) => [...prev, optimisticReply])

  const result = await createCommentAction(post.id, trimmed)
  if ('error' in result) {
    setReplies((prev) => prev.filter((r) => r.id !== optimisticReply.id))
    toast('Could not post your reply. Try again.')
    return
  }
  setReplies((prev) => prev.map((r) => (r.id === optimisticReply.id ? { ...r, id: result.id, createdAt: result.createdAt } : r)))
  toast('Reply posted.')
}
```

Pass `onReact={(postId) => reactToPostAction(postId).catch(() => toast('Could not update your reaction.'))}` to the `<FeedCard post={post} />` at the top of the thread. Reply-level likes (`replyLikes` state, the heart icon on each reply) can stay local-only for this handoff — `comments.reaction_count` exists in the schema from 059 but there's no `reactToCommentAction` yet, and Alex didn't ask for reply-liking specifically. Note this as a deliberate scope cut in your completion report rather than silently leaving it half-done; it's a small, obvious follow-up if Alex wants it later.

Commit: `feat(thread): wire reply composer and post reaction to real Server Actions`

### 5. `profile-view.tsx` — wire the Follow button (currently has no handler at all)

```tsx
'use client'
import { useState } from 'react'
// ...
import { followUserAction } from '@/actions/follows.actions'
import { toast } from '@/components/ui/toast'

interface ProfileViewProps {
  viewer: CurrentUser
  profile: UserProfile & { id: string; isFollowedByViewer: boolean } // see note below
  // ...unchanged
}

export function ProfileView({ viewer, profile, isOwnProfile, /* ... */ }: ProfileViewProps) {
  const [following, setFollowing] = useState(profile.isFollowedByViewer)

  async function handleFollowClick() {
    setFollowing((f) => !f)
    const result = await followUserAction(profile.id)
    if ('error' in result) {
      setFollowing((f) => !f)
      toast(result.error)
    }
  }
  // ...
  <Button size="sm" onClick={handleFollowClick}>{following ? 'Following' : 'Follow'}</Button>
```

`UserProfile` (in `lib/data/types.ts`) doesn't currently expose the profile's own `id` or whether the viewer already follows them — both are needed here. Add `id: string` and `isFollowedByViewer: boolean` to the `UserProfile` interface, and populate `isFollowedByViewer` in `getUserProfile()` (handoff 059's territory — if it didn't add this, add the query here: check `follows` for a row matching `(viewer.id, profile.id)`). Confirm against handoff 059's actual landed interface before assuming `id` is missing; add it here if it is.

The "Message" button stays a no-op — there's no messaging schema (`message_threads`/`messages` from `ROADMAP.md` are unbuilt), and that's a separate, larger feature Alex hasn't asked for yet. Don't wire it to anything.

Commit: `feat(profile): wire follow button to real Server Action`

---

## Verification

- [ ] Publishing a post from the composer shows it in the feed immediately, survives a page refresh, and is visible to a second real account.
- [ ] Liking/unliking a post persists across refresh and is visible to other users' view of the same post's count.
- [ ] Publishing/liking with the account's session invalidated (e.g. expired token) shows the failure toast and rolls back the optimistic UI rather than silently pretending to succeed.
- [ ] Replying on a thread page persists, increments the post's comment count on `/feed`, and the post author gets a notification (unless replying to their own post).
- [ ] Following a user from "Who to follow" or from their profile page persists, updates both users' follower/following counts, and reflects correctly if the viewer reloads the page (`following` state should read `true` post-refresh — that's the `isFollowedByViewer` wiring, test it specifically since it's easy to get backwards).
- [ ] Self-follow is rejected with a visible error, not a silent no-op.
- [ ] `pnpm type-check` passes.
