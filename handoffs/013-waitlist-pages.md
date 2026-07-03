# 013 — Waitlist system: landing page, signup, login, and waitlist pages

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feat` |
| **Branch** | `feature/waitlist-pages` |
| **Depends on** | 011 (Claude Design must deliver prototype + any new design system tokens first), 012 (backend must be merged first) |

---

## ⚠ Do not start this handoff until both dependencies are merged

This handoff is intentionally incomplete. It documents the scope and implementation rules, but the detailed component spec and CSS class names cannot be finalized until Claude Design delivers the prototype from handoff 011. When 011 is complete:

1. Read `design-handoffs/core-social-mvp/prototypes/03-landing-auth-waitlist.html` for look and behaviour.
2. Read `packages/design-system/CHANGELOG.md` — note any new tokens or component classes introduced.
3. Fill in this handoff with the actual component tree and CSS, then proceed.

---

## Scope

Four pages:

| Route | File | Auth state |
|---|---|---|
| `/` | `apps/web/src/app/(auth)/page.tsx` | Public |
| `/signup` | `apps/web/src/app/(auth)/signup/page.tsx` | Public |
| `/login` | `apps/web/src/app/(auth)/login/page.tsx` | Public |
| `/waitlisted` | `apps/web/src/app/(waitlisted)/page.tsx` | Session required (waitlisted only) |

---

## Implementation rules (apply regardless of design delivery)

### General

- RSC by default. Make pages Server Components unless a client interaction explicitly requires `'use client'` (form state, real-time handle availability check).
- Use the Server Actions from handoff 012 (`signupAction`, `loginAction`, `signoutAction`).
- Skeleton loading: each page that can be slow to load must have a `loading.tsx` sibling with a layout-accurate skeleton using the `.skeleton` class from `globals.css`.
- No hardcoded values. Every style must reference a design system token. If a needed token is missing, stop and request it — see root `CLAUDE.md` token request process.

### Forms

- All forms use `action={serverAction}` with a `useFormState` / `useActionState` hook for error display, not a client-side `onSubmit`.
- Pending state: disable the submit button and swap its label to a loading indicator while the action is in-flight (`useFormStatus`).
- Error messages must use the exact copy from `CLAUDE.md` → "Form copy for auth screens."

### Landing page

- The landing page is public and must be statically renderable. Do not add any async server data fetching to the root page — the "Live on Grassroots" stats card should be a Client Component that fetches at runtime (or is omitted from the static page entirely and added in a later sprint).
- The `USE_SEED_DATA` flag applies: in development, the stats card shows seeded values; in production, it queries real counts.

### `/waitlisted` page

- This page requires a valid session. Confirm the middleware in handoff 012 covers this (unauthenticated → `/login`).
- Read `display_name` server-side via `supabase.auth.getUser()` → query `users` table. Never read user data from the JWT alone for display purposes.
- The `signoutAction` from handoff 012 powers the "Sign out" button.

### Handle availability check (signup page)

- Implement as a debounced Client Component that calls a lightweight Server Action (or Route Handler) to check username uniqueness.
- The check must query `users.username` and return `{ available: boolean }`.
- Show inline feedback: a checkmark when available, an inline error when taken. Use `--color-accent` (sage) for available state, `--color-destructive` (or `--color-error` if it exists in the tokens) for taken state.
- Minimum debounce: 400ms. Only fire when the field has ≥ 3 characters.

---

## Coming next after this handoff

- Email confirmation flow (Supabase sends a verification email on signup — the UX for that state needs a design and implementation)
- Admin activation UI (promoting users from `waitlisted` → `active`)
- Password reset flow (`/forgot-password`)
