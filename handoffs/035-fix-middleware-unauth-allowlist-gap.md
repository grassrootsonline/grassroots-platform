# Fix middleware's unauthenticated-request gate — replace stale protected-path list with the existing allow-list

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/middleware-unauth-allowlist-gap` |
| **Depends on** | none |

---

## Problem

`apps/web/src/middleware.ts`'s no-session branch still gates access with a hardcoded deny-list of protected path prefixes:

```ts
if (!user) {
  if (
    pathname.startsWith('/feed') || pathname.startsWith('/u/') ||
    pathname.startsWith('/notifications') || pathname.startsWith('/messages') ||
    pathname.startsWith('/settings') || pathname === '/waitlisted'
  ) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return response;
}
```

Two problems with this list, both the same underlying flaw handoffs 021 and 030 already fixed one layer down (deny-list defaults to *allow*, not *deny*):

1. **It references a route that doesn't exist.** The profile route is `/profile/[username]` (built in handoff 023), not `/u/[username]`. The `/u/` prefix here matches nothing live in the app.
2. **Any current or future route not on this list falls through to `return response` with no session** — e.g. `/profile/<username>` today, and `/explore`, `/project/[slug]`, `/community/[slug]`, `/article/[slug]` per `docs/ARCHITECTURE.md` §4.2 once they're built. An unauthenticated request to any of those reaches the route with no redirect from middleware.

This is not currently exploitable for `/profile`: `getCurrentUser()` in `SupabaseDataClient` returns `null` for no session, and `profile/[username]/page.tsx` independently calls `redirect('/login')`. But that's a page-level safety net the middleware shouldn't be relying on — it's exactly the "defense-in-depth gap" pattern Alex flagged when handoff 021 was written ("any condition that leaves status unresolved currently grants access"), just one layer earlier in the request, and it will silently fail to protect any new route that forgets to add its own redirect.

---

## Background

The account_status check just below this block (added in handoffs 021/030) already solved this exact problem the right way: it uses `PUBLIC_PATHS` as an allow-list and blocks everything else by default. The no-session branch above it should use the same `PUBLIC_PATHS` constant instead of maintaining a second, separately-drifting list of protected prefixes. This also means no future route needs a middleware update to be protected — it's protected by default unless explicitly added to `PUBLIC_PATHS`.

---

## Affected files

- `apps/web/src/middleware.ts` — replace the no-session deny-list with an allow-list using the existing `PUBLIC_PATHS` constant

---

## Token dependencies

None — routing/auth logic only.

---

## Implementation steps

1. **Replace the no-session branch's deny-list with an allow-list**

   Replace:

   ```ts
   if (!user) {
     if (
       pathname.startsWith('/feed') || pathname.startsWith('/u/') ||
       pathname.startsWith('/notifications') || pathname.startsWith('/messages') ||
       pathname.startsWith('/settings') || pathname === '/waitlisted'
     ) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
     return response;
   }
   ```

   With:

   ```ts
   // No session — allow-list only. Anything not explicitly public (or the
   // waitlisted holding page) requires a session. Mirrors the account_status
   // allow-list below; do not reintroduce a route-specific deny-list here.
   if (!user) {
     if (!PUBLIC_PATHS.includes(pathname) && !pathname.startsWith('/waitlisted')) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
     return response;
   }
   ```

   Commit: `fix: gate unauthenticated requests with the existing PUBLIC_PATHS allow-list instead of a stale protected-path list`

---

## Verification

- [ ] With no session, visiting `/`, `/signup`, `/login`, `/check-email`, `/auth/callback` still loads with no redirect.
- [ ] With no session, visiting `/feed` redirects to `/login` (unchanged behavior).
- [ ] With no session, visiting `/profile/<any-username>` now redirects to `/login` at the middleware layer (previously fell through to the page's own redirect).
- [ ] With no session, visiting `/waitlisted` directly still loads (or follows existing behavior) rather than bouncing to `/login`.
- [ ] With a valid session and `active` status, `/feed` and `/profile/<username>` still load normally — confirm this change didn't affect the authenticated path at all.
- [ ] Grep `middleware.ts` for `'/u/'` — confirm zero results.
- [ ] `pnpm type-check` passes.
