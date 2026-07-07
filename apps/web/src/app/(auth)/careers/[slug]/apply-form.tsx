'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { applyToPostingAction } from '@/actions/careers.actions';
import s from './page.module.css';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? 'Submitting…' : 'Submit application'}
    </button>
  );
}

export function ApplyForm({ postingId }: { postingId: string }) {
  const [state, action] = useActionState(applyToPostingAction.bind(null, postingId), null);

  if (state && 'success' in state && state.success) {
    return (
      <div className={s.confirmCard}>
        <div className={s.confirmIcon}>
          <i className="ti ti-check" aria-hidden="true" />
        </div>
        <h2 className={s.confirmTitle}>Application received</h2>
        <p className={s.confirmBody}>
          Thanks for applying. We read every application and we&rsquo;ll be in touch if there&rsquo;s a fit.
        </p>
        <Link href="/careers" className={s.confirmLink}>Back to all roles</Link>
      </div>
    );
  }

  return (
    <div id="apply" className={s.applyCard}>
      <h2 className={s.applyTitle}>Apply for this role</h2>

      <form action={action} className={s.applyForm}>
        {state && 'error' in state && (
          <p className="field-error" role="alert">{state.error}</p>
        )}

        <div className={s.applyRow}>
          <div className="field">
            <label className="field-label" htmlFor="name">Full name</label>
            <input
              className="input"
              id="name"
              name="name"
              type="text"
              placeholder="Ada Lovelace"
              autoComplete="name"
              style={{ fontSize: '16px' }}
            />
          </div>
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
        </div>

        <div className="field">
          <label className="field-label" htmlFor="portfolioUrl">Portfolio or resume URL</label>
          <input
            className="input"
            id="portfolioUrl"
            name="portfolioUrl"
            type="url"
            placeholder="https://"
            style={{ fontSize: '16px' }}
          />
          <span className="field-hint">Link to your portfolio, GitHub, LinkedIn, or a hosted resume.</span>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="note">
            Note <span className={s.optionalLabel}>(optional)</span>
          </label>
          <textarea
            className="input"
            id="note"
            name="note"
            placeholder="Anything you'd like us to know."
          />
        </div>

        <div className={s.applyFooter}>
          <SubmitButton />
          <span className={s.applyFootnote}>We read every application.</span>
        </div>
      </form>
    </div>
  );
}
