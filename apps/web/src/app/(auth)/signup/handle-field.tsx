'use client';

import { useRef, useState } from 'react';
import { checkUsernameAction } from '@/actions/auth.actions';
import s from './page.module.css';

type Status = 'idle' | 'checking' | 'available' | 'taken';

export function HandleField() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setValue(raw);
    setStatus('idle');

    if (timerRef.current) clearTimeout(timerRef.current);

    if (raw.length >= 3) {
      setStatus('checking');
      timerRef.current = setTimeout(async () => {
        const result = await checkUsernameAction(raw);
        setStatus(result.available ? 'available' : 'taken');
      }, 400);
    }
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor="username">Handle</label>
      <div className="input-adorn-wrap">
        <span className="input-prefix">@</span>
        <input
          className={`input input-has-prefix${status === 'taken' ? ' input-error' : ''}`}
          id="username"
          name="username"
          type="text"
          placeholder="ada"
          value={value}
          onChange={handleChange}
          autoComplete="username"
          maxLength={30}
          style={{ fontSize: '16px' }}
        />
      </div>
      <span className="field-hint">3–30 characters. Letters, numbers, and underscores only.</span>
      {status === 'available' && (
        <span className={s.fieldOk}>
          <i className="ti ti-circle-check" aria-hidden="true" />
          {' '}@{value} is available
        </span>
      )}
      {status === 'taken' && (
        <span className="field-error">That username is taken. Try another.</span>
      )}
    </div>
  );
}
