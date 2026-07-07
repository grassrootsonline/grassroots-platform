# Fix active users not redirected off `/waitlisted`

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/waitlisted-active-redirect` |
| **Depends on** | none |

---

## Problem

`docs/ARCHITECTURE.md` §5.4 documents the intended route access rules:

| Route group | Session required | account_status required |
|---|---|---|
| `(waitlisted)/` — `/waitlisted` | Yes | `waitlisted` (active users redirected to `/feed`) |

The actual `apps/web/src/middleware.ts` does not do this. Its only active-user redirect is:

```ts
if (status === 'active' && (pathname === '/signup' || pathname === '/login' || pathname === '/')) {
  return NextResponse.redirect(new URL('/feed', request.url));
}
```

`/waitlisted` is missing from that condition. Confirmed directly: `apps/web/src/app/(waitlisted)/waitlisted/page.tsx` has no `account_status` awareness of its own either — it only checks for a session (`if (!user) redirect('/login')`) and otherwise renders unconditionally, so nothing compensates for the missing middleware check.

Net effect, reproduced while testing a manual `waitlisted` → `active` transition (the only way that transition happens today — see Background): a user sitting on `/waitlisted` when their account is activated is not carried through automatically. Reloading `/waitlisted` still renders "You're on the list" indefinitely; the only way to reach the platform is to manually navigate to `/feed` (or another gated route) directly, at which point the account-status gate correctly lets them through since they are in fact active. The gate itself is not broken or insecure — the missing piece is purely the redirect-away-from-`/waitlisted` step that the architecture doc already specifies.

---

## Background

There is currently no code path anywhere in `apps/web/src` that writes `account_status = 'active'` — confirmed by grep. This matches `ARCHITECTURE.md` §5.4 exactly ("Activation is intentionally manual during the launch period... `UPDATE users SET account_status = 'active' WHERE id = ...`"), so the manual-only activation mechanism itself is correct, by design, and not in scope here. The gap is specifically the missing auto-redirect once that manual flip has happened.

Separately — not part of this handoff, flagging for awareness only — `/waitlisted`'s copy ("We'll send you an email the moment access opens") isn't backed by any real email-sending code today; nothing in the repo calls the Resend API referenced in `.env.example`. That's a bigger, separate feature (an admin action plus a transactional email) worth its own roadmap conversation, not a quick fix alongside this one.

---

## Affected files

- `apps/web/src/middleware.ts` — extend the active-user redirect condition, line ~86

---

## Token dependencies

None — logic-only change.

---

## Implementation steps

1. **Add `/waitlisted` to the active-user redirect check**

   ```ts
   // Active user hitting auth pages or the waitlisted holding page — send to feed
   if (status === 'active' && (pathname === '/signup' || pathname === '/login' || pathname === '/' || pathname === '/waitlisted')) {
     return NextResponse.redirect(new URL('/feed', request.url));
   }
   ```

   No other logic needs to change — this condition already runs before the fail-closed allow-list check below it, so it takes precedence correctly.

   Commit: `fix(middleware): redirect active users off /waitlisted to /feed`

---

## Verification

- [ ] Manually set a test account's `account_status` to `active` while a session for that account is sitting on `/waitlisted`; reload `/waitlisted` and confirm it now redirects to `/feed` instead of re-rendering the holding page.
- [ ] Confirm `waitlisted`/`suspended` accounts visiting `/waitlisted` still see the holding page as before (no regression).
- [ ] Confirm `/signup`, `/login`, `/` still redirect active users to `/feed` as before (no regression to the existing part of this condition).
- [ ] `pnpm type-check` passes.
