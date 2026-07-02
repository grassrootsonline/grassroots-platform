# Fix waitlist gate bypass on account_status re-transition to waitlisted

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `critical` |
| **Type** | `fix` |
| **Branch** | `fix/waitlist-status-gate-bypass` |
| **Depends on** | none |

---

## Problem

`apps/web/src/middleware.ts` gates access using a **deny-list**: it blocks a request only when it can positively confirm `account_status === 'waitlisted'` or `'suspended'`. Everything else — including `active`, `undefined` (no profile row, failed query, `.single()` throwing on 0 or >1 rows), or any future status value — passes through untouched.

Reported repro: an account cycled `waitlisted → active → waitlisted`. Logging back in while the account is `waitlisted` lands the user on `/feed` instead of `/waitlisted`. `loginAction` (`apps/web/src/actions/auth.actions.ts`) always calls `redirect('/feed')` unconditionally and relies entirely on middleware to re-route waitlisted/suspended users — so any gap in the middleware's status check is a full bypass of the waitlist gate, not just a cosmetic misroute.

Whether the specific repro is caused by a stale profile lookup, a duplicate `users` row from earlier test signups, or something else, the underlying design flaw is the same: the gate fails **open** instead of **closed**. Any condition that leaves `status` unresolved currently grants access to the platform.

---

## Background

Per Alex: "If account status ever gets set back to waitlisted, the application itself should be blocked, and all pages should redirect back to `/waitlisted`, unless `account_status = active`." That is an allow-list requirement — only `active` should unlock protected routes — and the current implementation inverts it. This also matters beyond the reported bug: once RLS policies are added to `users`/`user_profiles` (open backlog item), a misconfigured policy could cause exactly this kind of failed/empty profile fetch, and today that would silently unlock the app rather than block it.

---

## Affected files

- `apps/web/src/middleware.ts` — replace the deny-list status checks with an allow-list gate

Do not touch `apps/web/src/actions/auth.actions.ts` or `apps/web/src/app/auth/callback/route.ts` — no changes needed there for this fix.

---

## Token dependencies

None — this is routing/auth logic only, no styling changes.

---

## Implementation steps

1. **Define an explicit public-path allow-list**

   Near the top of `middleware.ts`, add a constant listing the paths reachable regardless of `account_status`:

   ```ts
   const PUBLIC_PATHS = ['/', '/signup', '/login', '/check-email', '/auth/callback'];
   ```

   (`/auth/callback` is not currently exempted from the waitlisted-path check — add it here so a stale verification link clicked by an already-waitlisted, already-authenticated user doesn't get redirected to `/waitlisted` before the code/OTP exchange runs.)

   Commit: `fix: define public path allow-list in middleware`

2. **Move the suspended check first and keep it path-independent**

   Keep the existing suspended block exactly as-is, but move it above the active/waitlisted checks so a suspended account is signed out immediately regardless of which path triggered the request:

   ```ts
   if (status === 'suspended') {
     await supabase.auth.signOut();
     const url = new URL('/login', request.url);
     url.searchParams.set('reason', 'suspended');
     return NextResponse.redirect(url);
   }
   ```

   Commit: `fix: evaluate suspended status before active/waitlisted checks`

3. **Keep the active-user auth-page redirect**

   Unchanged:

   ```ts
   if (status === 'active' && (pathname === '/signup' || pathname === '/login' || pathname === '/')) {
     return NextResponse.redirect(new URL('/feed', request.url));
   }
   ```

   Commit: `chore: retain active-user auth-page redirect`

4. **Replace the deny-list waitlisted check with an allow-list active check**

   Delete the existing block:

   ```ts
   // Waitlisted user trying to access platform — send to holding page
   if (status === 'waitlisted' && pathname !== '/signup' && pathname !== '/login' && pathname !== '/' && pathname !== '/check-email') {
     if (!pathname.startsWith('/waitlisted')) {
       return NextResponse.redirect(new URL('/waitlisted', request.url));
     }
   }
   ```

   Replace it with:

   ```ts
   // Allow-list: only an 'active' account may reach a non-public route.
   // Anything else — waitlisted, missing profile row, a failed/erroring
   // query, or an unrecognized future status — is treated as not-active
   // and gated to /waitlisted. This must fail closed, not open.
   if (status !== 'active' && !PUBLIC_PATHS.includes(pathname) && !pathname.startsWith('/waitlisted')) {
     return NextResponse.redirect(new URL('/waitlisted', request.url));
   }
   ```

   Commit: `fix: gate protected routes on active status via allow-list, default to blocked`

5. **Capture the profile-fetch error explicitly**

   Update the destructure to also pull `error`, and note it's intentionally unused for branching (any error already falls through to the allow-list gate above since `status` stays `undefined`) — but log it so failures are visible instead of silent:

   ```ts
   const { data: profile, error: profileError } = await supabase
     .from('users')
     .select('account_status')
     .eq('auth_id', user.id)
     .single();

   if (profileError) {
     console.error('[middleware] account_status lookup failed for', user.id, profileError.message);
   }

   const status = profile?.account_status;
   ```

   Commit: `fix: log account_status lookup failures instead of failing silently`

---

## Verification

- [ ] Set a test account to `active`; confirm login lands on `/feed`.
- [ ] While still logged in, flip that account back to `waitlisted` directly in the database; reload `/feed` (no new login) — confirm immediate redirect to `/waitlisted`.
- [ ] Log out and log back in while `account_status = 'waitlisted'` — confirm the post-login redirect lands on `/waitlisted`, not `/feed`.
- [ ] Point the middleware's `auth_id` lookup at a non-existent id (or temporarily delete the test user's `users` row) to simulate a failed/empty profile fetch — confirm the request is redirected to `/waitlisted`, not allowed through.
- [ ] Confirm `suspended` accounts are still signed out and redirected to `/login?reason=suspended` regardless of the requested path.
- [ ] Confirm `/`, `/signup`, `/login`, `/check-email`, and `/auth/callback` remain reachable with no session and with a non-active session.
- [ ] Grep `middleware.ts` for `status === 'waitlisted'` — confirm zero results (the check is now allow-list based on `active`, not deny-list based on `waitlisted`).
