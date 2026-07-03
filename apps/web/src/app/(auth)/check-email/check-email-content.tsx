'use client';

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
          <p className={s.hint}>Didn&apos;t get it? Check your spam folder first.</p>
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
