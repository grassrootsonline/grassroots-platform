# Remove unconditional fake data from LeftRail, NotificationPanel, and ComposerModal

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/remove-fake-data-shell-components` |
| **Depends on** | none |

---

## Problem

Handoff 023 wired `feed`, `profile`, and `thread` pages to `getDataClient()` so production shows real (or honestly empty) data instead of fabricated mock content. Three components that render inside those same pages were missed and still hardcode fake data with no env branching at all:

- `apps/web/src/components/layout/left-rail.tsx` — a module-level `MOCK_PROJECTS` array (`Inference Stack`, `PromptKit`) rendered under "Your projects," shown to every signed-in user regardless of identity.
- `apps/web/src/components/notifications/notification-panel.tsx` — a module-level `MOCK_NOTIFICATIONS` array with fabricated actors ("Sarah Chen," "Marcus Rivera," "Priya Nair," "Leo Tanaka") rendered as if they were real activity on the signed-in user's account. Rendered from `navbar.tsx`, which is present on every authenticated page via `(platform)/layout.tsx`.
- `apps/web/src/components/feed/composer-modal.tsx` — the same `MOCK_PROJECTS` pair, populating the "attach to project" `<select>` in the post composer.

None of these three take a data prop or check `USE_SEED_DATA`. Today, in production, on `main`, with `USE_SEED_DATA=false`, a real user would still see two fake projects in their left rail, four fake notifications with invented names in their notification bell, and the same two fake projects in the composer's project picker. This is the exact class of bug handoff 023 was written to fix, on components that fell outside its file list.

---

## Background

There is no `notifications` table yet (per `docs/ARCHITECTURE.md` §5.2, `notifications` is a designed table but hasn't shipped in `packages/db/src/schema.ts`, which only has `users`/`user_profiles`) and no `projects` table either. Per the precedent handoff 023 established: where a real backing schema doesn't exist yet, `SupabaseDataClient` returns a real, honest empty result and the UI renders an empty state — it does not keep showing fabricated content as a stopgap. This handoff applies that same precedent to the three components above.

---

## Affected files

- `apps/web/src/lib/data/types.ts` — add `getNotifications()` and `getUserProjects()` to `DataClient`
- `apps/web/src/lib/data/seed-client.ts` — implement both against existing/new mock constants
- `apps/web/src/lib/data/supabase-client.ts` — implement both returning `[]` (no backing schema yet)
- `apps/web/src/lib/mock-data.ts` — add `MOCK_NOTIFICATIONS` and `MOCK_SIDEBAR_PROJECTS` (moved from the components below)
- `apps/web/src/components/layout/left-rail.tsx` — accept a `projects` prop instead of the local `MOCK_PROJECTS`
- `apps/web/src/components/notifications/notification-panel.tsx` — accept a `notifications` prop instead of the local `MOCK_NOTIFICATIONS`
- `apps/web/src/components/layout/navbar.tsx` — accept a `notifications` prop, pass through to `NotificationPanel`
- `apps/web/src/components/feed/composer-modal.tsx` — accept a `projects` prop instead of the local `MOCK_PROJECTS`
- `apps/web/src/app/(platform)/layout.tsx` — fetch notifications via `getDataClient()`, pass to `Navbar`
- `apps/web/src/app/(platform)/feed/page.tsx`, `feed/feed-view.tsx` — fetch/pass `projects` for `LeftRail` and `ComposerModal`
- `apps/web/src/app/(platform)/profile/[username]/page.tsx`, `profile-view.tsx` — fetch/pass `sidebarProjects` for `LeftRail` (see naming note below — do not call this prop `projects`)
- `apps/web/src/app/(platform)/feed/[postId]/page.tsx`, `thread-view.tsx` — fetch/pass `sidebarProjects` for `LeftRail`

---

## Token dependencies

None — data wiring and component props only, no new styles.

---

## Implementation steps

1. **Extend `DataClient`**

   `apps/web/src/lib/data/types.ts`:

   ```ts
   export interface SidebarProject {
     name: string
     slug: string
   }

   export interface AppNotification {
     id: string
     actor: { name: string; username: string; avatarUrl: string | null }
     text: string
     time: string
     read: boolean
   }
   ```

   Add `getUserProjects(): Promise<SidebarProject[]>` and `getNotifications(): Promise<AppNotification[]>` to `DataClient`. (Note: this is a *different* method from the already-existing `getProfileProjects(username)` — that one is for a viewed profile's project tab; this one is "my projects" for the left rail, scoped to the current user.)

   Commit: `feat: add getUserProjects and getNotifications to DataClient`

2. **`SeedDataClient`**

   Move the existing fake arrays into `lib/mock-data.ts` as `MOCK_SIDEBAR_PROJECTS` and `MOCK_NOTIFICATIONS` (same shape, values unchanged), then:

   ```ts
   async getUserProjects(): Promise<SidebarProject[]> { return MOCK_SIDEBAR_PROJECTS }
   async getNotifications(): Promise<AppNotification[]> { return MOCK_NOTIFICATIONS }
   ```

   Commit: `feat: implement getUserProjects/getNotifications on SeedDataClient`

3. **`SupabaseDataClient`**

   No `projects` or `notifications` table exists yet — real, honest empty results, matching the pattern already used for `getFeedPosts()`/`getTrendingProjects()` etc.:

   ```ts
   async getUserProjects(): Promise<SidebarProject[]> { return [] }
   async getNotifications(): Promise<AppNotification[]> { return [] }
   ```

   Commit: `feat: add empty getUserProjects/getNotifications stubs to SupabaseDataClient pending schema`

4. **`LeftRail` takes a `projects` prop**

   Replace the local `MOCK_PROJECTS` constant and its usage with a `projects: SidebarProject[]` prop. When `projects.length === 0`, hide the "Your projects" section entirely rather than rendering an empty label with nothing under it.

   Commit: `refactor(left-rail): accept projects prop, remove hardcoded MOCK_PROJECTS`

5. **`NotificationPanel` takes a `notifications` prop**

   Replace `MOCK_NOTIFICATIONS` with a `notifications: AppNotification[]` prop. Add an empty state ("No notifications yet.") when the array is empty, using the existing `.empty-state` pattern from the design system at a reduced/compact scale appropriate for the panel.

   Commit: `refactor(notification-panel): accept notifications prop, remove hardcoded MOCK_NOTIFICATIONS`

6. **`Navbar` threads `notifications` through**

   `Navbar` becomes `{ user, notifications }`, passes `notifications` to `<NotificationPanel notifications={notifications} onClose={...} />`.

   Commit: `refactor(navbar): thread notifications prop through to NotificationPanel`

7. **`ComposerModal` takes a `projects` prop**

   Replace `MOCK_PROJECTS` with a `projects: SidebarProject[]` prop feeding the `<select>`. When empty, keep just the "No project" option (already the default) — no other change needed to the empty case.

   Commit: `refactor(composer-modal): accept projects prop, remove hardcoded MOCK_PROJECTS`

8. **Wire all four call sites**

   - `(platform)/layout.tsx`: call `getDataClient().getNotifications()` alongside the existing `getCurrentUser()` call, pass to `<Navbar user={user} notifications={notifications} />`.
   - `feed/page.tsx`: add `client.getUserProjects()` to the existing `Promise.all(...)`, pass `projects` to `FeedView`, which passes it to both `<LeftRail>` and `<ComposerModal>`.
   - `profile/[username]/page.tsx`: add `client.getUserProjects()` (this is the *viewer's* own projects for their own left rail, not the profile-being-viewed's projects — don't confuse with the existing `getProfileProjects(username)` call). **Naming: `ProfileViewProps` already has a `projects: ProfileProject[]` field, consumed by the "Projects" tab content, not `LeftRail`.** Add the new data as a separate prop named `sidebarProjects: SidebarProject[]` to avoid a name collision/shadowing bug — do not reuse `projects` for this. Pass `sidebarProjects` to `<LeftRail>` inside `ProfileView`; leave the existing `projects` prop and its tab usage untouched.
   - `feed/[postId]/page.tsx`: same addition — add a `sidebarProjects: SidebarProject[]` prop to `ThreadViewProps` (no existing `projects` prop there, but use the same name for consistency across all three views), pass to `ThreadView` → `<LeftRail>`.

   Commit: `feat: wire getUserProjects/getNotifications into layout, feed, profile, and thread pages`

---

## Verification

- [ ] With `USE_SEED_DATA=true`: left rail, notification panel, and composer project picker render exactly as they do today (same mock content).
- [ ] With `USE_SEED_DATA=false` and live Supabase: left rail shows no "Your projects" section, notification panel shows an empty state, composer project picker shows only "No project" — no fabricated names anywhere.
- [ ] `pnpm type-check` passes.
- [ ] Grep `apps/web/src/components/layout/left-rail.tsx`, `apps/web/src/components/notifications/notification-panel.tsx`, and `apps/web/src/components/feed/composer-modal.tsx` for `MOCK_` — confirm zero results.
- [ ] Grep `apps/web/src` for `Sarah Chen|Marcus Rivera|Priya Nair|Leo Tanaka|Inference Stack|PromptKit` outside `lib/mock-data.ts` and `lib/data/seed-client.ts` — confirm zero results.
- [ ] `ProfileView`'s existing `projects: ProfileProject[]` prop (used by the "Projects" tab) is untouched and still receives the `getProfileProjects(username)` result — confirm the new sidebar data landed as a separate `sidebarProjects` prop, not a collision/overwrite.
