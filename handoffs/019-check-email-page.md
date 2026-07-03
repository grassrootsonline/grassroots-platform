# 019 — Email verification: /check-email page and login error state

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feat` |
| **Branch** | `feature/check-email-page` |
| **Depends on** | 017 (Claude Design must deliver prototype/tokens first), 018 (backend must be merged first) |

---

## Context

With the backend from handoff 018 in place, the signup flow redirects to `/check-email` when email confirmation is required. This handoff builds the UI for that page, and adds the verification error banner to the `/login` page.

**Before starting:** read `design-handoffs/core-social-mvp/prototypes/` for the latest version of the check-email screen from Claude Design. Read `packages/design-system/CHANGELOG.md` for any new tokens added in handoff 017.

---

## Part 1 — `/check-email` page

**File:** `apps/web/src/app/(auth)/check-email/page.tsx` (create)
**File:** `apps/web/src/app/(auth)/check-email/page.module.css` (create)

This is a **Server Component** that reads the `?email=` search param and passes it to a client component for the resend interaction.

### Page structure

```tsx
// page.tsx
import { Suspense } from 'react';
import { CheckEmailContent } from './check-email-content';

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}
```

```tsx
// check-email-content.tsx  ('use client')
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { resendVerificationAction } from '@/actions/auth.actions';
import s from './page.module.css';

export function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function handleResend() {
    setResendState('sending');
    await resendVerificationAction(email);
    setResendState('sent');
  }

  return (
    <div className={s.page}>
      <Link href="/" className={s.wordmarkLink}>
        <span className={s.wordmark}>Grassroots</span>
      </Link>

      <div className={`panel animate-scale-in ${s.card}`}>
        <div className={s.iconWrap}>
          <i className={`ti ti-mail ${s.icon}`} aria-hidden="true" />
        </div>

        <div className={s.copy}>
          <h1 className={s.heading}>Check your inbox</h1>
          <p className={s.body}>
            We sent a verification link to{' '}
            <strong className={s.email}>{email || 'your email address'}</strong>.
            Click it to confirm your account and join the waitlist.
          </p>
          <p className={s.hint}>Didn't get it? Check your spam folder first.</p>
        </div>

        <div className={s.resendRow}>
          {resendState === 'sent' ? (
            <span className={s.sentConfirm}>
              <i className="ti ti-circle-check" aria-hidden="true" /> Sent.
            </span>
          ) : (
            <button
              className={s.resendBtn}
              onClick={handleResend}
              disabled={resendState === 'sending'}
            >
              {resendState === 'sending' ? 'Sending…' : 'Resend the email'}
            </button>
          )}
        </div>
      </div>

      <p className={s.switchText}>
        Wrong email?{' '}
        <Link href="/signup" className={s.inlineLink}>Sign up with a different one</Link>
      </p>
    </div>
  );
}
```

### CSS module

Follow the check-email design from prototype 017. All values must use design system tokens — no hardcoded px values. The icon badge should use `--avatar-xs` (or the appropriate avatar size token) for width and height, matching the waitlist page's icon badge pattern. If a value has no token, stop and raise a token request per CLAUDE.md.

The `s.page`, `s.wordmark`, and `s.card` layout should follow the same pattern as `/waitlisted` and `/signup` — centered, `--color-canvas` background, `--space-2xl` vertical padding.

### `resendVerificationAction`

**File:** `apps/web/src/actions/auth.actions.ts` — add this action:

```ts
export async function resendVerificationAction(email: string): Promise<void> {
  if (!email) return;
  const supabase = await createServerClient();
  // Best-effort — ignore errors (user may not exist, may already be confirmed)
  await supabase.auth.resend({ type: 'signup', email });
}
```

---

## Part 2 — Verification error banner on `/login`

**File:** `apps/web/src/app/(auth)/login/page.tsx`

The login page is currently a client component. Read the `?error` search param and display an inline notice when `error === 'verification_expired'`.

Add a `useSearchParams()` call and a conditional banner above the form:

```tsx
const searchParams = useSearchParams();
const authError = searchParams.get('error');

// In JSX, before the <form>:
{authError === 'verification_expired' && (
  <div className={s.errorBanner} role="alert">
    That verification link has expired.{' '}
    <Link href="/check-email" className={s.inlineLink}>Request a new one</Link>
  </div>
)}
```

Add `.errorBanner` to `login/page.module.css`. Style it as a page-level notice (not a field error) — reference the design from prototype 017. Use `--color-danger` for the text / border, `--color-danger-subtle` (if it exists in tokens) for the background. If the token doesn't exist, raise a token request before hardcoding.

---

## Part 3 — `loading.tsx` files

Both the `/check-email` page and the existing auth pages should have layout-accurate skeletons.

**File:** `apps/web/src/app/(auth)/check-email/loading.tsx` (create)

```tsx
export default function CheckEmailLoading() {
  return (
    <div className="panel-page">
      <div className="skeleton" style={{ width: 120, height: 28 }} />
      <div className="panel">
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto' }} />
        <div className="skeleton" style={{ width: '60%', height: 24, margin: '0 auto' }} />
        <div className="skeleton" style={{ width: '90%', height: 16 }} />
        <div className="skeleton" style={{ width: '70%', height: 16 }} />
      </div>
    </div>
  );
}
```

Note: `style={}` here is acceptable — skeleton dimensions are dynamic layout values not design tokens.

---

## Verification checklist

- [ ] `/check-email` page renders correctly with `?email=...` param populated
- [ ] `/check-email` page renders gracefully with no email param (falls back to "your email address")
- [ ] Resend button shows "Sending…" while in-flight, then "Sent." confirmation with check icon
- [ ] Wordmark links to `/`
- [ ] "Sign up with a different one" links to `/signup`
- [ ] Login page shows the error banner when `?error=verification_expired` is present
- [ ] Login page renders normally when no error param is present
- [ ] No hardcoded px values in either module CSS (exception: `font-size: 16px` on inputs if present)
- [ ] `pnpm type-check` passes

Commit: `feat: add check-email page and verification error state on login`
