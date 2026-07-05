# Fix middleware PUBLIC_PATHS gap (/privacy, /terms, /careers)

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/middleware-public-paths` |
| **Depends on** | none |

---

## Problem

`apps/web/src/middleware.ts` gates every non-public route behind session/account-status checks using an allow-list, `PUBLIC_PATHS`. That array currently is:

```ts
const PUBLIC_PATHS = ['/', '/signup', '/login', '/check-email', '/auth/callback'];
```

`/privacy`, `/terms`, and `/careers` are all real, intentionally-public marketing/legal pages, but none of them are in this list. Result: a logged-out visitor hitting any of the three gets redirected to `/login` (via the no-session branch, line ~51), and a logged-in-but-not-active visitor gets redirected to `/waitlisted` (via the account-status branch, line ~87) — instead of just reading the page. This was caught and verified directly (307 redirects observed) by Claude Code while wiring the `/careers` footer link in handoff 044, and correctly left out of that handoff's scope since `middleware.ts` wasn't in its affected-files list.

Practical impact: the landing page footer links to all three pages for anonymous visitors, but two of the three routes silently redirect logged-out users away — that link has been broken for `/privacy` and `/terms` since those pages shipped (handoffs 027/028), and now also for `/careers`.

---

## Affected files

- `apps/web/src/middleware.ts` — `PUBLIC_PATHS` array only, line 4

---

## Token dependencies

None — this is a one-line array edit, no styling involved.

---

## Implementation steps

1. **Add the three paths to `PUBLIC_PATHS`**

   ```ts
   const PUBLIC_PATHS = ['/', '/signup', '/login', '/check-email', '/auth/callback', '/privacy', '/terms', '/careers'];
   ```

   No other logic in the file needs to change — both allow-list checks (`!user` branch and the `status !== 'active'` branch) already key off this same array, so adding the paths here fixes both cases at once.

   Commit: `fix(middleware): add /privacy, /terms, /careers to PUBLIC_PATHS allow-list`

---

## Verification

- [ ] Logged-out visitor can load `/privacy`, `/terms`, and `/careers` directly with no redirect.
- [ ] Logged-in but non-`active` (e.g. `waitlisted`) visitor can also load all three without being sent to `/waitlisted`.
- [ ] `/login`, `/signup`, and protected routes (e.g. `/feed`) still redirect exactly as before — no regression to the existing gate logic.
- [ ] `pnpm type-check` passes (trivial, but keep the habit).
