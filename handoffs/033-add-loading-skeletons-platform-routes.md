# Add `loading.tsx` Suspense skeletons for feed, profile, and thread routes

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `fix` |
| **Branch** | `fix/platform-route-loading-skeletons` |
| **Depends on** | none |

---

## Problem

`docs/ARCHITECTURE.md` §6.4 requires: "Route segments use `loading.tsx` files to stream Suspense boundaries. The shell renders instantly; content streams in." Handoff 023 converted `feed/page.tsx`, `profile/[username]/page.tsx`, and `feed/[postId]/page.tsx` from client components with no server latency into `async` Server Components that call `getDataClient()` and `await` real database queries. That conversion is exactly what makes a `loading.tsx` boundary necessary — and none of the three routes has one. Today, navigating to any of them shows a blank tab / default browser loading state (or a frozen previous page under App Router's default behavior) for the duration of the data fetch, instead of an instant layout-accurate shell.

The `(auth)` route group already establishes the pattern correctly: `check-email/loading.tsx`, `login/loading.tsx`, and `signup/loading.tsx` all exist and use the existing `.skeleton` utility class with inline dimensions. This handoff extends the same pattern to the three `(platform)` routes that need it.

---

## Background

This is not a new capability to build — `globals.css`'s `.skeleton` class and the shimmer animation already exist and are already used exactly this way for the auth routes. The gap is purely that the three data-fetching platform routes were never given their `loading.tsx` file when they were converted to Server Components.

---

## Affected files

- `apps/web/src/app/(platform)/feed/loading.tsx` — new
- `apps/web/src/app/(platform)/profile/[username]/loading.tsx` — new
- `apps/web/src/app/(platform)/feed/[postId]/loading.tsx` — new

---

## Token dependencies

None — reuses the existing `.skeleton` utility class and design tokens already used by the `(auth)` loading files.

---

## Implementation steps

1. **`feed/loading.tsx`**

   Match `feed-view.tsx`'s layout: left rail column + composer block + a handful of feed card placeholders in the center column.

   **Correction from the original draft of this handoff: don't hand-roll generic skeleton divs for the feed cards.** `apps/web/src/components/feed/feed-card.tsx` already exports a `FeedCardSkeleton` component built exactly for this, dimensionally accurate to the real `FeedCard` (per `ARCHITECTURE.md` §12.4's `PostCard` + `PostCardSkeleton` convention) — reuse it instead of approximating with raw `<div className="skeleton">` heights:

   ```tsx
   import { FeedCardSkeleton } from '@/components/feed/feed-card'

   export default function FeedLoading() {
     return (
       <div style={{ display: 'flex', gap: 'var(--space-relaxed)' }}>
         <div className="skeleton" style={{ width: 240, height: 400, borderRadius: 'var(--radius-lg)' }} />
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
           <div className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />
           {[1, 2, 3, 4].map((i) => (
             <FeedCardSkeleton key={i} />
           ))}
         </div>
       </div>
     );
   }
   ```

   (The left-rail placeholder and composer-row placeholder still need approximate dimensions — there's no `LeftRailSkeleton` yet, so measure against the real rendered `LeftRail`/composer row and adjust the width/height above accordingly; the values shown are a starting approximation, not exact. Use `var(--space-relaxed)` for the gap, not a raw `24px` — see handoff 034 for why.)

   Commit: `feat(feed): add loading.tsx skeleton`

2. **`profile/[username]/loading.tsx`**

   Match `profile-view.tsx`'s layout: left rail + back link + profile header block (avatar + name/stats) + tab row + a couple of card placeholders.

   Commit: `feat(profile): add loading.tsx skeleton`

3. **`feed/[postId]/loading.tsx`**

   Match `thread-view.tsx`'s layout: left rail + back link + the original post card + a couple of reply placeholders.

   Commit: `feat(thread): add loading.tsx skeleton`

---

## Verification

- [ ] Navigating to `/feed`, `/profile/<username>`, and `/feed/<postId>` shows an instant layout-accurate skeleton shell (not a blank page or frozen previous route) while data loads — easiest to confirm by throttling network in devtools or adding a temporary artificial delay to the data client during a local check.
- [ ] Skeleton dimensions are visually close to the real rendered content — no large layout shift when real content replaces the skeleton.
- [ ] All three files use only `var(--space-*)` / `var(--radius-*)` tokens, no raw hex or unlisted px values beyond the approximate placeholder heights described above (those are dimension approximations, not colors/spacing — acceptable per the existing `(auth)` loading.tsx precedent, which does the same).
- [ ] `feed/loading.tsx` renders feed-card placeholders via the existing `FeedCardSkeleton` component, not hand-rolled generic skeleton divs.
- [ ] `pnpm type-check` passes.
