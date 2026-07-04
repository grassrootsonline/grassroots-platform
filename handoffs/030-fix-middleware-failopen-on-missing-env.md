# Fix middleware fail-open when Supabase env vars are absent

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `critical` |
| **Type** | `fix` |
| **Branch** | `fix/middleware-failopen-missing-env` |
| **Depends on** | none |

---

## Problem

`apps/web/src/middleware.ts` opens with:

```ts
if (
  process.env.USE_SEED_DATA === 'true' ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  return NextResponse.next({ request });
}
```

This is intended to let seed/preview mode through without touching Supabase. But the second and third conditions aren't scoped to seed mode at all — they trigger on the *mere absence* of the two public Supabase env vars, regardless of `NEXT_PUBLIC_APP_ENV` or `USE_SEED_DATA`. If those variables are ever unset, misspelled, or scoped to the wrong environment in Vercel (a config mistake, not a code path anyone tests routinely), every request — including on `main` in production — skips authentication and the entire `account_status` gate (suspended check, waitlist allow-list from handoff 021) and is passed straight through to `NextResponse.next()`. An unauthenticated visitor would reach `/feed`, `/settings`, or any other protected route with no session and no redirect to `/login`.

This is the same category of bug handoff 021 fixed one layer down (the allow-list logic) — a missing/unresolvable condition defaulting to *allow* instead of *deny*. That fix didn't touch this outer bypass, which predates it and sits in front of it.

---

## Background

Per root `CLAUDE.md`, seed mode is meant to be selected explicitly via `NEXT_PUBLIC_APP_ENV` + `USE_SEED_DATA=true`, and `main`/production must always run through the live Supabase-backed path. Gating middleware bypass on *variable absence* rather than an explicit, intentional flag means a deployment misconfiguration silently degrades to "no auth at all" instead of failing loudly. Given handoff 021 was written specifically because "any condition that leaves `status` unresolved currently grants access to the platform," this outer condition is the same flaw at an earlier point in the request.

---

## Affected files

- `apps/web/src/middleware.ts` — tighten the bypass condition and fail loudly instead of open

---

## Token dependencies

None — routing/auth logic only.

---

## Implementation steps

1. **Scope the seed-mode bypass to `USE_SEED_DATA` only, and fail closed on missing config outside seed mode**

   Replace the current opening block with:

   ```ts
   // Seed/preview mode: pass through, the seeded session handles auth in-app.
   if (process.env.USE_SEED_DATA === 'true') {
     return NextResponse.next({ request });
   }

   // Outside seed mode, Supabase config is mandatory. Missing it is a
   // deployment misconfiguration, not a valid state — fail closed rather
   // than silently disabling auth for every request.
   if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
     console.error('[middleware] Supabase env vars missing outside seed mode — blocking all non-public routes');
     const pathname = request.nextUrl.pathname;
     if (!PUBLIC_PATHS.includes(pathname)) {
       return NextResponse.redirect(new URL('/', request.url));
     }
     return NextResponse.next({ request });
   }
   ```

   This must sit above the existing `createServerClient(...)` call, which currently assumes both env vars are present (non-null assertions `!` on both).

   Commit: `fix: fail closed instead of open when Supabase env vars are missing outside seed mode`

---

## Verification

- [ ] With `USE_SEED_DATA=true` and no Supabase env vars set: behavior unchanged from today (pass-through).
- [ ] With `USE_SEED_DATA` unset/false and both Supabase env vars present: behavior unchanged from today (normal auth flow).
- [ ] With `USE_SEED_DATA` unset/false and `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` deliberately unset: confirm requests to `/feed` redirect to `/`, not pass through unauthenticated. Confirm `/`, `/login`, `/signup`, etc. still load.
- [ ] Confirm the error is logged (visible in Vercel function logs) so a misconfiguration doesn't fail silently.
- [ ] Grep `middleware.ts` for the old combined condition — confirm the seed-mode check and the missing-env check are now separate, non-overlapping blocks.
