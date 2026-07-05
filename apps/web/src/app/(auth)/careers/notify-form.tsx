'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { notifyMeAction } from '@/actions/careers.actions';
import s from './page.module.css';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Sending…' : 'Notify me'}
    </button>
  );
}

export function NotifyForm() {
  const [state, action] = useActionState(notifyMeAction, null);

  if (state && 'success' in state && state.success) {
    return (
      <div className={s.card}>
        <p className={s.cardTitle}>You&rsquo;re on the list</p>
        <p className={s.cardBody}>We&rsquo;ll reach out if something opens up that might be a fit.</p>
      </div>
    );
  }

  return (
    <div className={s.card}>
      <p className={s.cardTitle}>Stay in the loop</p>
      <p className={s.cardBody}>
        Drop your email and we&rsquo;ll reach out when something opens up that might be a fit.
      </p>

      <form action={action} className={s.form}>
        {state && 'error' in state && (
          <p className="field-error" role="alert">{state.error}</p>
        )}

        <div className={s.formRow}>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            style={{ fontSize: '16px' }}
          />
          <SubmitButton />
        </div>
      </form>

      <p className={s.cardFootnote}>No spam. Unsubscribe anytime.</p>
    </div>
  );
}
