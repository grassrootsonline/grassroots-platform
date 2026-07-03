# Build getDataClient() and wire feed/profile/layout to it

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feature` |
| **Branch** | `feat/data-client-layer` |
| **Depends on** | none |

---

## Problem

`getDataClient()` / `SeedDataClient` / `SupabaseDataClient` — mandated by root `CLAUDE.md` — does not exist. `(platform)/layout.tsx`, `feed/page.tsx`, `profile/[username]/page.tsx`, and `feed/[postId]/page.tsx` are Client Components that import hardcoded fake data directly from `lib/mock-data.ts` (`MOCK_USER`, `MOCK_POSTS`, fabricated names), with no branching on `USE_SEED_DATA` at all. Today, on `main`, in production, a real signed-in user would see a feed of fabricated posts ("Sarah Chen," "Marcus Rivera," etc.) and their own profile page would render `MOCK_USER` regardless of which username they visited — because nothing in these pages ever queries Supabase.

---

## Background

There is no `posts`, `projects`, or `communities` table yet — only `users` and `user_profiles` exist (see `packages/db/src/schema.ts`). So this handoff does two different things depending on whether real data exists:

- **`users`/`user_profiles`-backed data** (current user, profile-by-username) gets a real `SupabaseDataClient` implementation today.
- **Everything else** (feed posts, trending projects, who-to-follow, profile projects, thread replies) has no backing schema yet. `SupabaseDataClient` returns empty results for these — a real, honest, empty production state — rather than continuing to fabricate content. Pages must handle the empty case gracefully. This is not a stopgap to revisit later in this same handoff; the posts/social schema is a separate, larger design effort.

The public landing page (`(auth)/page.tsx`) also reads `MOCK_PLATFORM_STATS` for its stats bar. That's marketing copy on an unauthenticated page, not user data — **out of scope here**, left untouched.

Data shapes below are designed to match what `lib/mock-data.ts` already exports (e.g. `name` rather than `display_name`) so the existing JSX in each page needs minimal changes beyond swapping the import for a prop. One deliberate exception: `MOCK_USER.pronouns` has no backing column anywhere in the schema — drop it from the real types; the profile page already renders it conditionally (`{profile.pronouns && ...}`) so it just won't show until a future schema adds it.

---

## Affected files

- `apps/web/src/lib/data/types.ts` — new
- `apps/web/src/lib/data/seed-client.ts` — new
- `apps/web/src/lib/data/supabase-client.ts` — new
- `apps/web/src/lib/data/index.ts` — new
- `apps/web/src/app/(platform)/layout.tsx` — convert to Server Component
- `apps/web/src/app/(platform)/feed/page.tsx` — split into Server + Client Component
- `apps/web/src/app/(platform)/feed/feed-view.tsx` — new (Client Component)
- `apps/web/src/app/(platform)/profile/[username]/page.tsx` — split into Server + Client Component
- `apps/web/src/app/(platform)/profile/[username]/profile-view.tsx` — new (Client Component)
- `apps/web/src/app/(platform)/feed/[postId]/page.tsx` — split into Server + Client Component
- `apps/web/src/app/(platform)/feed/[postId]/thread-view.tsx` — new (Client Component)

Do not touch `apps/web/src/app/(auth)/page.tsx` (landing page stats) — out of scope, see Background.

---

## Token dependencies

None — data/architecture only, no new styles.

---

## Implementation steps

1. **Data types** — `apps/web/src/lib/data/types.ts`

   ```ts
   import type { FeedPost } from '@/components/feed/feed-card'

   export type { FeedPost }

   export interface CurrentUser {
     id: string
     name: string
     username: string
     avatarUrl: string | null
     bio: string | null
     followerCount: number
     followingCount: number
     projectCount: number
     accountStatus: 'waitlisted' | 'active' | 'suspended'
   }

   export interface UserProfile {
     id: string
     name: string
     username: string
     avatarUrl: string | null
     bio: string | null
     followerCount: number
     followingCount: number
     projectCount: number
   }

   export interface TrendingProject {
     name: string
     slug: string
     watchers: number
   }

   export interface SuggestedUser {
     name: string
     username: string
     tagline: string
     avatarUrl: string | null
   }

   export interface ProfileProject {
     id: string
     name: string
     slug: string
     description: string
     postCount: number
     collaboratorCount: number
   }

   export interface Reply {
     id: string
     author: { name: string; username: string; avatarUrl: string | null }
     content: string
     createdAt: string
     reactionCount: number
   }

   export interface DataClient {
     getCurrentUser(): Promise<CurrentUser | null>
     getUserProfile(username: string): Promise<UserProfile | null>
     getFeedPosts(): Promise<FeedPost[]>
     getPost(postId: string): Promise<FeedPost | null>
     getTrendingProjects(): Promise<TrendingProject[]>
     getWhoToFollow(): Promise<SuggestedUser[]>
     getProfileProjects(username: string): Promise<ProfileProject[]>
     getThreadReplies(postId: string): Promise<Reply[]>
   }
   ```

   Commit: `feat: define DataClient interface and shared data types`

2. **`SeedDataClient`** — `apps/web/src/lib/data/seed-client.ts`

   Wraps the existing mock constants so nothing in seed/dev mode changes behaviorally:

   ```ts
   import type {
     DataClient, CurrentUser, UserProfile, FeedPost,
     TrendingProject, SuggestedUser, ProfileProject, Reply,
   } from './types'
   import {
     MOCK_USER, MOCK_POSTS, MOCK_TRENDING,
     MOCK_WHO_TO_FOLLOW, MOCK_REPLIES,
   } from '@/lib/mock-data'

   const MOCK_PROFILE_PROJECTS: ProfileProject[] = [
     { id: '1', name: 'Inference Stack', slug: 'inference-stack', description: 'High-throughput batched inference for open-source LLMs.', postCount: 12, collaboratorCount: 3 },
     { id: '2', name: 'PromptKit', slug: 'promptkit', description: 'Structured output, retries, and a local prompt playground.', postCount: 8, collaboratorCount: 1 },
   ]

   export class SeedDataClient implements DataClient {
     async getCurrentUser(): Promise<CurrentUser | null> {
       const { pronouns: _pronouns, account_status, ...rest } = MOCK_USER
       return { ...rest, accountStatus: account_status }
     }

     async getUserProfile(_username: string): Promise<UserProfile | null> {
       const { pronouns: _pronouns, account_status: _s, ...rest } = MOCK_USER
       return rest
     }

     async getFeedPosts(): Promise<FeedPost[]> { return MOCK_POSTS }

     async getPost(postId: string): Promise<FeedPost | null> {
       return MOCK_POSTS.find((p) => p.id === postId) ?? MOCK_POSTS[0] ?? null
     }

     async getTrendingProjects(): Promise<TrendingProject[]> { return MOCK_TRENDING }
     async getWhoToFollow(): Promise<SuggestedUser[]> { return MOCK_WHO_TO_FOLLOW }
     async getProfileProjects(_username: string): Promise<ProfileProject[]> { return MOCK_PROFILE_PROJECTS }
     async getThreadReplies(_postId: string): Promise<Reply[]> { return MOCK_REPLIES }
   }
   ```

   Commit: `feat: add SeedDataClient backed by lib/mock-data`

3. **`SupabaseDataClient`** — `apps/web/src/lib/data/supabase-client.ts`

   ```ts
   import { db } from '@grassroots/db'
   import { createServerClient } from '@/lib/supabase/server'
   import type {
     DataClient, CurrentUser, UserProfile, FeedPost,
     TrendingProject, SuggestedUser, ProfileProject, Reply,
   } from './types'

   export class SupabaseDataClient implements DataClient {
     async getCurrentUser(): Promise<CurrentUser | null> {
       const supabase = await createServerClient()
       const { data: { user } } = await supabase.auth.getUser()
       if (!user) return null

       const row = await db.query.users.findFirst({
         where: (u, { eq }) => eq(u.authId, user.id),
       })
       if (!row) return null

       return {
         id: row.id,
         name: row.displayName,
         username: row.username,
         avatarUrl: row.avatarUrl,
         bio: row.bio,
         followerCount: row.followerCount,
         followingCount: row.followingCount,
         projectCount: 0, // no projects table yet
         accountStatus: row.accountStatus,
       }
     }

     async getUserProfile(username: string): Promise<UserProfile | null> {
       const row = await db.query.users.findFirst({
         where: (u, { eq }) => eq(u.username, username),
       })
       if (!row) return null

       return {
         id: row.id,
         name: row.displayName,
         username: row.username,
         avatarUrl: row.avatarUrl,
         bio: row.bio,
         followerCount: row.followerCount,
         followingCount: row.followingCount,
         projectCount: 0,
       }
     }

     // No posts/projects/communities schema yet — real, empty results.
     async getFeedPosts(): Promise<FeedPost[]> { return [] }
     async getPost(_postId: string): Promise<FeedPost | null> { return null }
     async getTrendingProjects(): Promise<TrendingProject[]> { return [] }
     async getWhoToFollow(): Promise<SuggestedUser[]> { return [] }
     async getProfileProjects(_username: string): Promise<ProfileProject[]> { return [] }
     async getThreadReplies(_postId: string): Promise<Reply[]> { return [] }
   }
   ```

   Commit: `feat: add SupabaseDataClient for users/user_profiles, empty stubs for unbuilt schema`

4. **Factory** — `apps/web/src/lib/data/index.ts`

   ```ts
   import { SeedDataClient } from './seed-client'
   import { SupabaseDataClient } from './supabase-client'
   import type { DataClient } from './types'

   export function getDataClient(): DataClient {
     return process.env.USE_SEED_DATA === 'true'
       ? new SeedDataClient()
       : new SupabaseDataClient()
   }

   export type {
     DataClient, CurrentUser, UserProfile, FeedPost,
     TrendingProject, SuggestedUser, ProfileProject, Reply,
   } from './types'
   ```

   Commit: `feat: add getDataClient() factory`

5. **`(platform)/layout.tsx`** — convert to a Server Component

   ```ts
   import { Navbar } from '@/components/layout/navbar'
   import { Toaster } from '@/components/ui/toast'
   import { getDataClient } from '@/lib/data'
   import s from './layout.module.css'

   export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
     const user = await getDataClient().getCurrentUser()

     return (
       <>
         <Navbar user={user} />
         {process.env.USE_SEED_DATA === 'true' && (
           <div className={s.devBanner}>
             <i className="ti ti-database icon-xs" aria-hidden="true" />
             Development build · seeded data
           </div>
         )}
         <div className={`container-platform ${s.main}`}>
           {children}
         </div>
         <Toaster />
       </>
     )
   }
   ```

   Note the banner condition changed from `USE_SEED_DATA === 'true' || NEXT_PUBLIC_APP_ENV !== 'production'` to just `USE_SEED_DATA === 'true'` — the old condition would show "seeded data" on any non-production deploy even once it's reading real Supabase data, which is wrong. The banner should reflect what data is actually being shown.

   Commit: `refactor: convert PlatformLayout to Server Component using getDataClient()`

6. **`feed/page.tsx`** — split into a Server Component and a Client Component

   Create `apps/web/src/app/(platform)/feed/feed-view.tsx` as a Client Component containing the existing `FeedPage` body verbatim, renamed to `FeedView`, accepting props instead of importing mocks:

   ```ts
   interface FeedViewProps {
     user: CurrentUser
     initialPosts: FeedPost[]
     trending: TrendingProject[]
     whoToFollow: SuggestedUser[]
   }
   ```

   Replace every `MOCK_USER` reference with `user`, `MOCK_POSTS` with the `initialPosts` prop (still seeded into local `useState` exactly as today — the composer's optimistic local-add behavior is unchanged and still not persisted anywhere; that's expected until a real posts table and Server Action exist), `MOCK_TRENDING` with `trending`, `MOCK_WHO_TO_FOLLOW` with `whoToFollow`.

   Add an empty state to the posts list: when `posts.length === 0`, render a simple centered message ("No posts yet. Be the first to share what you're building.") instead of an empty `<motion.div>`.

   Then reduce `page.tsx` to:

   ```ts
   import { getDataClient } from '@/lib/data'
   import { FeedView } from './feed-view'
   import { redirect } from 'next/navigation'

   export default async function FeedPage() {
     const client = getDataClient()
     const user = await client.getCurrentUser()
     if (!user) redirect('/login')

     const [initialPosts, trending, whoToFollow] = await Promise.all([
       client.getFeedPosts(),
       client.getTrendingProjects(),
       client.getWhoToFollow(),
     ])

     return (
       <FeedView
         user={user}
         initialPosts={initialPosts}
         trending={trending}
         whoToFollow={whoToFollow}
       />
     )
   }
   ```

   Commit: `refactor: split feed page into Server Component + FeedView client component`

7. **`profile/[username]/page.tsx`** — split into a Server Component and a Client Component

   Create `apps/web/src/app/(platform)/profile/[username]/profile-view.tsx` as a Client Component containing the existing `ProfilePage` body verbatim, renamed to `ProfileView`:

   ```ts
   interface ProfileViewProps {
     viewer: CurrentUser
     profile: UserProfile
     isOwnProfile: boolean
     initialPosts: FeedPost[]
     projects: ProfileProject[]
   }
   ```

   Replace `MOCK_USER` (for the `LeftRail`) with `viewer`, the `isOwnProfile` computed line with the `isOwnProfile` prop, `profile = MOCK_USER` with the `profile` prop, `MOCK_POSTS.filter(...)` with `initialPosts`, `MOCK_PROJECTS_PROFILE` with `projects`. Drop `profile.pronouns` references — the type no longer has that field.

   Reduce `page.tsx` to:

   ```ts
   import { getDataClient } from '@/lib/data'
   import { ProfileView } from './profile-view'
   import { redirect, notFound } from 'next/navigation'

   export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
     const { username } = await params
     const client = getDataClient()

     const viewer = await client.getCurrentUser()
     if (!viewer) redirect('/login')

     const profile = await client.getUserProfile(username)
     if (!profile) notFound()

     const [initialPosts, projects] = await Promise.all([
       client.getFeedPosts(), // TODO: filter by author once posts schema exists
       client.getProfileProjects(username),
     ])

     return (
       <ProfileView
         viewer={viewer}
         profile={profile}
         isOwnProfile={viewer.username === profile.username}
         initialPosts={initialPosts}
         projects={projects}
       />
     )
   }
   ```

   This also fixes a real bug in the current mock version: visiting any other user's profile always rendered your own mock data regardless of the `username` in the URL. Now `getUserProfile(username)` actually looks up the requested user.

   Commit: `refactor: split profile page into Server Component + ProfileView; fix profile-by-username lookup`

8. **`feed/[postId]/page.tsx`** — same pattern

   Create `apps/web/src/app/(platform)/feed/[postId]/thread-view.tsx` as a Client Component (`ThreadView`) with the existing body, taking `user: CurrentUser`, `post: FeedPost`, `initialReplies: Reply[]` as props in place of the mock imports.

   Reduce `page.tsx` to:

   ```ts
   import { getDataClient } from '@/lib/data'
   import { ThreadView } from './thread-view'
   import { redirect, notFound } from 'next/navigation'

   export default async function ThreadPage({ params }: { params: Promise<{ postId: string }> }) {
     const { postId } = await params
     const client = getDataClient()

     const user = await client.getCurrentUser()
     if (!user) redirect('/login')

     const post = await client.getPost(postId)
     if (!post) notFound()

     const initialReplies = await client.getThreadReplies(postId)

     return <ThreadView user={user} post={post} initialReplies={initialReplies} />
   }
   ```

   Commit: `refactor: split thread page into Server Component + ThreadView`

---

## Verification

- [ ] With `USE_SEED_DATA=true`: feed, profile, and thread pages render exactly as they do today (same mock content), dev banner shows
- [ ] With `USE_SEED_DATA=false` and live Supabase configured: signing in as a real `active` user shows their real `display_name`/`username`/`avatar_url` in the navbar, left rail, and composer
- [ ] With `USE_SEED_DATA=false`: feed page shows the "no posts yet" empty state, not an error, not fake posts
- [ ] With `USE_SEED_DATA=false`: visiting `/profile/<real-username>` shows that user's real profile data, not the signed-in user's own data
- [ ] With `USE_SEED_DATA=false`: visiting `/profile/<nonexistent-username>` renders a 404 (`notFound()`), not a crash
- [ ] Dev banner does not show when `USE_SEED_DATA` is unset/false, even on a non-production `NEXT_PUBLIC_APP_ENV`
- [ ] `pnpm type-check` passes
- [ ] Grep `apps/web/src/app/(platform)` for `MOCK_USER`, `MOCK_POSTS`, `MOCK_TRENDING`, `MOCK_WHO_TO_FOLLOW`, `MOCK_REPLIES` — confirm zero results outside `feed-view.tsx`/`profile-view.tsx`/`thread-view.tsx`'s `SeedDataClient` (i.e., the mock module is only imported from `lib/data/seed-client.ts` now, not from any page)

---

## What this handoff does NOT cover

- Real feed posts, trending projects, who-to-follow, profile projects, or thread replies — no backing schema exists; this is a future, larger schema-design effort
- `(auth)/page.tsx` landing page stats bar — cosmetic marketing copy, not user data, left on `MOCK_PLATFORM_STATS`
- Persisting composer-created posts anywhere — still a client-side-only optimistic add, same as today
- Redis caching layer (`lib/redis/`) for profile/session data per `docs/ARCHITECTURE.md` §5.3/§6.1 — not wired; `getCurrentUser()`/`getUserProfile()` hit the database directly on every call for now
