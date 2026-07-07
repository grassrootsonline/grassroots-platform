# Remove unused mock `AuthModal` component

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `refactor` |
| **Branch** | `chore/remove-unused-auth-modal` |
| **Depends on** | none |

---

## Problem

`apps/web/src/components/auth/auth-modal.tsx` (+ its co-located `auth-modal.module.css`) is dead code: nothing in the app imports or renders `<AuthModal />`. Confirmed by grepping the entire `apps/web/src` tree for `auth-modal` and for the `AuthModal` symbol — the only match for either is the file itself.

Worse than merely unused, it's actively misleading: it fakes real auth behavior. `handleSubmit` does `await new Promise((r) => setTimeout(r, 600))`, then shows a toast and calls `onSuccess` — no Supabase call, no Server Action, no real account creation. This is the same file handoff 044 had to explicitly warn against: "Do **not** use `apps/web/src/components/auth/auth-modal.tsx` as a reference — despite its name, it's a client-only mock... and doesn't reflect how this app actually wires forms to the backend." That warning was necessary precisely because the component's name and shape (a polished signup/login form) look like the real thing at a glance.

---

## Background

The real auth flow is fully built as dedicated pages — `/signup` and `/login` (`apps/web/src/app/(auth)/signup/page.tsx`, `.../login/page.tsx`) — using `useActionState` + real Server Actions (`signupAction`/`loginAction` in `apps/web/src/actions/auth.actions.ts`), wired since handoffs 012/013. The landing page links to `/signup` directly (`<Link href="/signup" className="btn btn-primary">Sign up</Link>`), not a modal trigger. There's no current product direction calling for a modal-based quick-auth pattern anywhere in `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, or the landing prototype — this component reads as a pre-real-backend prototype artifact that was superseded by the page-based flow and never removed.

This is a judgment call worth a beat of Alex's attention before deleting outright — not because the code is ambiguous (it clearly isn't used and clearly doesn't work for real), but because if there's a future product reason to want a modal-based auth entry point (e.g. "sign up without leaving the page you're on"), deleting it now means rebuilding from scratch later rather than fixing it in place. My recommendation is to delete it: it's currently 100% dead, it's already caused one documented confusion incident, and rebuilding a modal variant later — for real, wired to the actual Server Actions — would be cleaner than trying to retrofit this mock.

---

## Approved (2026-07-06)

Alex approved deletion — proceed as written below.

---

## Affected files

- `apps/web/src/components/auth/auth-modal.tsx` — delete
- `apps/web/src/components/auth/auth-modal.module.css` — delete

---

## Token dependencies

None — deletion only, no styling changes.

---

## Implementation steps

1. **Delete the component and its stylesheet**

   Remove both files:
   - `apps/web/src/components/auth/auth-modal.tsx`
   - `apps/web/src/components/auth/auth-modal.module.css`

   Confirm no other file imports `AuthModal` before deleting (re-grep at implementation time in case something changed since this handoff was written).

   Commit: `refactor: remove unused mock AuthModal component`

---

## Verification

- [ ] Grep the repo for `AuthModal` and `auth-modal` — zero matches remain.
- [ ] `pnpm type-check` and `pnpm lint` pass (no dangling imports).
- [ ] `apps/web/src/components/auth/` directory is removed entirely if these were its only contents (confirm at implementation time).
