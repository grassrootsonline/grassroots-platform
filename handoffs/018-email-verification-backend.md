# 018 — Email verification: auth callback route and signup action update

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feat` |
| **Branch** | `feature/email-verification-backend` |
| **Depends on** | 016 must be merged; 012 must be merged |

---

## Context

In production, Supabase requires email confirmation before issuing a session. The current `signupAction` redirects to `/waitlisted` unconditionally — but when email confirmation is enabled, `signUp` returns `session: null` and the user lands at the middleware with no session, which bounces them to `/login` with no explanation.

This handoff fixes the signup flow and adds the `/auth/callback` route that Supabase redirects to after the user clicks their verification email.

No UI in this handoff. That's handoff 019 (depends on 017 from Claude Design).

---

## Part 1 — Update `signupAction`

**File:** `apps/web/src/actions/auth.actions.ts`

After the successful `supabase.auth.signUp()` call, check `authData.session`. If it's null, email confirmation is required — redirect to `/check-email` instead of `/waitlisted`.

Replace the current end of `signupAction` (after the `user_profiles` insert) with:

```ts
  // Insert user_profiles row (unchanged)
  await db.insert(userProfiles).values({
    userId: newUser.id,
    displayName,
  });

  // If Supabase returned no session, email confirmation is required.
  // Redirect to the check-email screen — the user will get a session
  // after clicking their verification link.
  if (!authData.session) {
    redirect(`/check-email?email=${encodeURIComponent(email)}`);
  }

  // Session present (email confirmation disabled, e.g. in local dev).
  redirect('/waitlisted');
```

**No other changes to `signupAction`.** The username check, Supabase signUp, and DB inserts all stay as-is. The user row is created before confirmation — this is intentional and reserves the username immediately.

### Behaviour difference: production vs. development

| Environment | Email confirmation | `authData.session` | Redirect after signup |
|---|---|---|---|
| Production | Enabled | `null` | `/check-email?email=...` |
| Local dev (seed mode) | Bypassed (USE_SEED_DATA=true) | N/A — middleware passes through | N/A |
| Local dev (Supabase local) | Disabled by default | Present | `/waitlisted` |

---

## Part 2 — Create `/auth/callback` route handler

**File:** `apps/web/src/app/auth/callback/route.ts` (create)

This is the URL Supabase redirects to after the user clicks their email verification link. The URL will contain either a `code` (PKCE) or `token_hash` + `type` query params.

```ts
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const supabase = await createServerClient();

  // PKCE flow (OAuth, magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/waitlisted`);
    }
  }

  // Email OTP flow (email confirmation link)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'email' });
    if (!error) {
      return NextResponse.redirect(`${origin}/waitlisted`);
    }
  }

  // Error: expired link, already used, etc.
  return NextResponse.redirect(`${origin}/login?error=verification_expired`);
}
```

**Note on the redirect target:** After verification, we redirect to `/waitlisted`. The middleware then checks `account_status` — if it's `waitlisted` the user stays there; if they've been activated to `active`, they're sent to `/feed`. The callback route doesn't need to know which state the user is in.

---

## Part 3 — Middleware update

**File:** `apps/web/src/middleware.ts`

Two changes:

### 3.1 — Add `/check-email` to public routes

The `/check-email` page has no session (the user hasn't verified yet). Add it to the no-session allowlist alongside `/signup` and `/login`:

In the "No session" block, update the protected route check:

```ts
if (!user) {
  if (
    pathname.startsWith('/feed') || pathname.startsWith('/u/') ||
    pathname.startsWith('/notifications') || pathname.startsWith('/messages') ||
    pathname.startsWith('/settings') || pathname === '/waitlisted'
  ) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return response; // /check-email, /signup, /login, / all pass through
}
```

`/check-email` is already covered by `return response` since it's not in the protected list. Verify that it doesn't accidentally get caught by the waitlisted user redirect either.

### 3.2 — Prevent waitlisted users hitting `/check-email`

In the "Waitlisted user" block, add `/check-email` alongside `/signup` and `/login` as allowed routes:

```ts
if (status === 'waitlisted' && pathname !== '/signup' && pathname !== '/login' && pathname !== '/' && pathname !== '/check-email') {
  if (!pathname.startsWith('/waitlisted')) {
    return NextResponse.redirect(new URL('/waitlisted', request.url));
  }
}
```

---

## Part 4 — Supabase configuration checklist

This is not a code change — it's a pre-production checklist. Add the following to `docs/ARCHITECTURE.md` under a new `§17.x Supabase production setup` or note it in the existing §17 (Environment Configuration). Place it wherever fits best in context.

```markdown
#### Supabase production configuration

Before going live, verify the following in the Supabase dashboard (Authentication → Settings):

- **Email confirmations:** must be **enabled**. Without this, users get a session immediately on signup and bypass the verification step entirely.
- **Site URL:** set to the production domain (e.g. `https://grassroots.community`).
- **Redirect URLs:** must include `https://grassroots.community/auth/callback` (and the Vercel preview URL pattern if needed for staging: `https://*.vercel.app/auth/callback`).
- **Email templates:** customise the "Confirm signup" email in the Supabase dashboard. Minimum: update the subject line and button text to match the platform voice.

In local development with Supabase CLI (`supabase start`), email confirmation is disabled by default, so `signupAction` will redirect to `/waitlisted` directly. This is the expected local dev behaviour.
```

---

## Part 5 — Rate limiting on auth endpoints (recommended)

The auth actions currently have no rate limiting. Before going to production, add IP-based rate limiting to `signupAction` and `loginAction` using Upstash Ratelimit. A basic guard:

```ts
// In signupAction (and loginAction), before any Supabase calls:
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes per IP
});

const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1';
const { success } = await ratelimit.limit(`auth:${ip}`);
if (!success) {
  return { error: 'Too many attempts. Please wait a few minutes and try again.' };
}
```

This requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the environment. If those env vars aren't yet configured, leave a `// TODO: add rate limiting before launch` comment and log an issue — do not block the feature on it, but it must be in before `main` goes live.

---

## Verification checklist

- [ ] `signupAction` redirects to `/check-email?email=...` when `authData.session` is null
- [ ] `signupAction` still redirects to `/waitlisted` when `authData.session` is present (local dev path)
- [ ] `GET /auth/callback` exchanges code or token_hash correctly
- [ ] On successful verification → redirects to `/waitlisted` (middleware routes from there)
- [ ] On error → redirects to `/login?error=verification_expired`
- [ ] Middleware allows `/check-email` without a session
- [ ] Middleware allows waitlisted users to access `/check-email`
- [ ] Supabase configuration checklist added to `docs/ARCHITECTURE.md`
- [ ] `pnpm type-check` passes

Commit: `feat: add auth callback route and update signup flow for email verification`
