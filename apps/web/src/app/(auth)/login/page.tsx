'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from '@/actions/auth.actions';
import s from './page.module.css';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn btn-primary ${s.submitBtn}`} disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');

  return (
    <div className="panel-page">
      <Link href="/" className={s.wordmarkLink}>
        <span className={s.wordmark}>Grassroots</span>
      </Link>

      <div className="panel animate-scale-in">
        <div className={s.panelHeader}>
          <h1 className={s.panelTitle}>Welcome back</h1>
        </div>

        <form action={action} className={s.form}>
          {authError === 'verification_expired' && (
            <div className={s.errorBanner} role="alert">
              That verification link has expired.{' '}
              <Link href="/check-email" className={s.inlineLink}>Request a new one</Link>
            </div>
          )}

          {state?.error && (
            <p className="field-error" role="alert">{state.error}</p>
          )}

          <div className="field">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              placeholder="ada@example.com"
              autoComplete="email"
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••••"
              autoComplete="current-password"
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className={s.forgotRow}>
            <Link href="#" className={s.forgotLink}>Forgot your password?</Link>
          </div>

          <SubmitButton />
        </form>

        <p className={s.switchText}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className={s.inlineLink}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
