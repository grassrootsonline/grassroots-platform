'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { signupAction } from '@/actions/auth.actions';
import { HandleField } from './handle-field';
import s from './page.module.css';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn btn-primary ${s.submitBtn}`} disabled={pending}>
      {pending ? 'Creating account…' : 'Create account'}
    </button>
  );
}

export default function SignupPage() {
  const [state, action] = useActionState(signupAction, null);

  return (
    <div className="panel-page">
      <Link href="/" className={s.wordmarkLink}>
        <span className={s.wordmark}>Grassroots</span>
      </Link>

      <div className="panel animate-scale-in">
        <div className={s.panelHeader}>
          <h1 className={s.panelTitle}>Create your account</h1>
          <p className={s.panelSubtitle}>Join the community building in public.</p>
        </div>

        <form action={action} className={s.form}>
          {state?.error && (
            <p className="field-error" role="alert">{state.error}</p>
          )}

          <div className="field">
            <label className="field-label" htmlFor="displayName">Display name</label>
            <input
              className="input"
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Ada Lovelace"
              autoComplete="name"
              maxLength={100}
              style={{ fontSize: '16px' }}
            />
          </div>

          <HandleField />

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
              autoComplete="new-password"
              style={{ fontSize: '16px' }}
            />
            <span className="field-hint">At least 10 characters.</span>
          </div>

          <SubmitButton />
        </form>

        <p className={s.switchText}>
          Already have an account?{' '}
          <Link href="/login" className={s.inlineLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
