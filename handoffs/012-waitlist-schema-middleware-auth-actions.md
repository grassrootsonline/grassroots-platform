# 012 — Waitlist system: schema migration, middleware, and auth server actions

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feat` |
| **Branch** | `feature/waitlist-backend` |
| **Depends on** | 010 (process rules — merge first) |

---

## Context

This is the first live-backend work on the project. These are the foundational pieces the landing page and auth screens (handoff 011 + 013) are built on. The goal is to ship everything in this handoff independently of the UI work so both tracks can proceed in parallel.

Scope:
1. Database migration — add `account_status` enum and column to `users`
2. Drizzle schema update — sync `packages/db/` with the migration
3. ARCHITECTURE.md update — reflect new column and add waitlist section
4. Middleware — route gating by session + account_status
5. Server Actions — signup and login

---

## Part 1 — Database migration

### 1.1 New enum

```sql
CREATE TYPE account_status AS ENUM ('waitlisted', 'active', 'suspended');
```

### 1.2 Column addition to `users`

```sql
ALTER TABLE users
  ADD COLUMN account_status account_status NOT NULL DEFAULT 'waitlisted';
```

**Do not drop `is_suspended` yet.** Leave it in place. It is used elsewhere (§8 Permission System references it). We will consolidate in a later migration handoff once `suspended` routing is implemented. For now, `account_status = 'suspended'` and `is_suspended = true` are parallel — middleware should check `account_status` only.

Migration file goes in `supabase/migrations/` with a Drizzle-generated filename. Run `pnpm drizzle-kit generate` after updating the Drizzle schema (step 1.3).

### 1.3 Drizzle schema update (`packages/db/`)

In the Drizzle schema file for `users`, add:

```ts
export const accountStatusEnum = pgEnum('account_status', [
  'waitlisted',
  'active',
  'suspended',
]);

// In the users table definition:
accountStatus: accountStatusEnum('account_status').notNull().default('waitlisted'),
```

### 1.4 Supabase RLS

Add a policy so users can read their own `account_status`:

```sql
CREATE POLICY "Users can read own account_status"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);
```

The `account_status` column does not need to be user-writable — status changes are admin/server-side only.

---

## Part 2 — ARCHITECTURE.md update

**File:** `docs/ARCHITECTURE.md`

### 2.1 Users table — add the new column

In the `users` table definition in §5.2, add after the `is_suspended` line:

```
account_status  account_status NOT NULL DEFAULT 'waitlisted'
```

Also add a comment note immediately after the table block:

```
> ⚠ `is_suspended` is deprecated in favour of `account_status = 'suspended'` and will be removed in a future migration. Do not introduce new reads of `is_suspended` in new code — read `account_status` instead.
```

### 2.2 Add §5.4 — Waitlist system

Insert a new section after §5.3 (User system):

```markdown
### 5.4 Waitlist system

During the early access period, all newly created accounts default to `account_status = 'waitlisted'`. Waitlisted users are fully authenticated Supabase users with a session — they simply cannot access the `(platform)` route group.

**Status transitions:**

| Transition | Trigger |
|---|---|
| `waitlisted` → `active` | Manual admin action — UPDATE users SET account_status = 'active' WHERE id = ... |
| `active` → `suspended` | Moderation action (Platform Mod or Administrator) |
| `suspended` → `active` | Moderation action (lift suspension) |

There is no self-service path from `waitlisted` to `active`. Activation is intentionally manual during the launch period.

**Route access by status:**

| Route group | Session required | account_status required |
|---|---|---|
| `(auth)/` — `/`, `/signup`, `/login` | No | Any (active users redirected to `/feed`) |
| `(waitlisted)/` — `/waitlisted` | Yes | `waitlisted` (active users redirected to `/feed`) |
| `(platform)/` — `/feed`, etc. | Yes | `active` |
```

---

## Part 3 — Route groups

The current `(auth)/` route group in §4.2 shows `register/`. Rename this folder to `signup/` — the route is `/signup`, not `/register`. Add `waitlisted/` as a new top-level route group.

Updated structure for `apps/web/src/app/`:

```
(auth)/            # Public pages — redirect active+session → /feed
  page.tsx         # Landing page at /
  signup/
    page.tsx
  login/
    page.tsx
(waitlisted)/      # Auth required, account_status = waitlisted only
  page.tsx         # Holding page at /waitlisted
(platform)/        # Auth required, account_status = active only
  layout.tsx
  feed/
  ...
```

---

## Part 4 — Middleware

**File:** `apps/web/src/middleware.ts` (create if absent)

The middleware runs on every request. It reads the Supabase session and `account_status`, then gates access to route groups.

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // No session — allow public routes, redirect platform routes to /login
  if (!user) {
    if (pathname.startsWith('/feed') || pathname.startsWith('/u/') ||
        pathname.startsWith('/notifications') || pathname.startsWith('/messages') ||
        pathname.startsWith('/settings') || pathname === '/waitlisted') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // Session exists — fetch account_status
  const { data: profile } = await supabase
    .from('users')
    .select('account_status')
    .eq('auth_id', user.id)
    .single();

  const status = profile?.account_status;

  // Active user hitting auth pages — send to feed
  if (status === 'active' && (pathname === '/signup' || pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  // Waitlisted user trying to access platform — send to holding page
  if (status === 'waitlisted' && !pathname.startsWith('/waitlisted')) {
    if (pathname !== '/signup' && pathname !== '/login' && pathname !== '/') {
      return NextResponse.redirect(new URL('/waitlisted', request.url));
    }
  }

  // Suspended user — sign them out and redirect to login with a flag
  if (status === 'suspended') {
    await supabase.auth.signOut();
    const url = new URL('/login', request.url);
    url.searchParams.set('reason', 'suspended');
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Important:** The middleware queries the `users` table on every request. This is acceptable for now. If latency becomes an issue in a future sprint, cache `account_status` in the Supabase session's `user_metadata` at login time and refresh it on status change.

---

## Part 5 — Auth Server Actions

**File:** `apps/web/src/actions/auth.actions.ts` (create)

### 5.1 Signup action

```ts
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@packages/db';
import { users, userProfiles } from '@packages/db/schema';
import { redirect } from 'next/navigation';

const SignupSchema = z.object({
  displayName: z.string().min(1).max(100),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Handle may only contain lowercase letters, numbers, and underscores'),
  email: z.string().email(),
  password: z.string().min(10, 'Password must be at least 10 characters.'),
});

export async function signupAction(formData: FormData) {
  const parsed = SignupSchema.safeParse({
    displayName: formData.get('displayName'),
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { displayName, username, email, password } = parsed.data;
  const supabase = await createServerClient();

  // 1. Check username availability before creating auth user
  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.username, username),
    columns: { id: true },
  });
  if (existing) {
    return { error: 'That username is taken. Try another.' };
  }

  // 2. Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName, username } },
  });

  if (authError) {
    if (authError.code === 'user_already_exists') {
      return { error: 'An account with that email already exists. Sign in instead?' };
    }
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Something went wrong. Please try again.' };
  }

  // 3. Insert into users — account_status defaults to 'waitlisted'
  const [newUser] = await db.insert(users).values({
    authId: authData.user.id,
    username,
    displayName,
    accountStatus: 'waitlisted',
  }).returning({ id: users.id });

  // 4. Insert user_profiles row
  await db.insert(userProfiles).values({
    userId: newUser.id,
    displayName,
  });

  redirect('/waitlisted');
}
```

### 5.2 Login action

```ts
'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: 'Please enter a valid email and password.' };
  }

  const { email, password } = parsed.data;
  const supabase = await createServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Incorrect email or password.' };
  }

  // Middleware handles the redirect to /feed or /waitlisted based on account_status.
  redirect('/feed');
}
```

### 5.3 Signout action

```ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signoutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
```

---

## Part 6 — Seed data update

In `packages/db/seed` / `lib/data/seed.ts`, update the seeded user objects to include `account_status: 'active'` for all existing seed users. Without this, the seeded session will trip the middleware and redirect to `/waitlisted` in development.

---

## Part 7 — Environment variables

Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in `.env.local` and Vercel's project environment (for preview + production). These must exist before any of this code runs.

Add to `.env.local` template / `apps/web/.env.example` if not already present:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Verification checklist

- [ ] Migration file generated and applies cleanly (`pnpm supabase db push` or equivalent)
- [ ] `account_status` column visible in Supabase Table Editor with default `waitlisted`
- [ ] Drizzle schema compiles, `pnpm type-check` passes
- [ ] ARCHITECTURE.md §5.2 shows new column; §5.4 exists
- [ ] `(auth)/register/` renamed to `(auth)/signup/`; `(waitlisted)/` route group exists
- [ ] Middleware gates:
  - Unauthenticated hitting `/feed` → `/login` ✓
  - Waitlisted hitting `/feed` → `/waitlisted` ✓
  - Active hitting `/signup` → `/feed` ✓
  - Active hitting `/waitlisted` → `/feed` ✓
- [ ] Signup action: new account created in Supabase Auth + `users` + `user_profiles`, redirect to `/waitlisted`
- [ ] Login action: session established, middleware routes correctly
- [ ] Signout action: session cleared, redirect to `/`
- [ ] Seed users all have `account_status: 'active'`

Commit: `feat: add waitlist schema, middleware gating, and auth server actions`

---

## What this handoff does NOT cover

- UI for the landing page, signup, login, and waitlist pages — see handoff 011 (Claude Design) and handoff 013 (Claude Code, coming after 011)
- Email notifications when a user is activated from waitlisted → active
- Admin UI for activating waitlisted users
- Password reset flow (`/forgot-password`) — linked in designs as placeholder only
