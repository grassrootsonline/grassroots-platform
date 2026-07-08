'use client'

import { useState, useTransition } from 'react'
import { setAccountStatusAction } from '@/actions/admin-users.actions'
import s from './users.module.css'

interface UserRowProps {
  user: { id: string; displayName: string; username: string; accountStatus: 'waitlisted' | 'active' | 'suspended'; createdAt: Date }
  statusBadge: Record<string, string>
  statusLabel: Record<string, string>
}

export function UserRow({ user, statusBadge, statusLabel }: UserRowProps) {
  const [status, setStatus] = useState(user.accountStatus)
  const [isPending, startTransition] = useTransition()

  function handleSetStatus(next: 'waitlisted' | 'active' | 'suspended') {
    setStatus(next) // optimistic
    startTransition(async () => {
      await setAccountStatusAction(user.id, next)
    })
  }

  return (
    <tr>
      <td>
        <div className={s.userCell}>
          <span className={s.userName}>{user.displayName}</span>
          <span className={s.userHandle}>@{user.username}</span>
        </div>
      </td>
      <td><span className={`badge ${statusBadge[status]}`}>{statusLabel[status]}</span></td>
      <td className={s.joined}>{new Date(user.createdAt).toLocaleDateString()}</td>
      <td className={s.right}>
        <div className={s.actions}>
          {status !== 'active' && (
            <button className="btn btn-sm btn-secondary" disabled={isPending} onClick={() => handleSetStatus('active')}>
              Activate
            </button>
          )}
          {status !== 'suspended' && (
            <button className="btn btn-sm btn-ghost" disabled={isPending} onClick={() => handleSetStatus('suspended')}>
              Suspend
            </button>
          )}
          {status === 'suspended' && (
            <button className="btn btn-sm btn-secondary" disabled={isPending} onClick={() => handleSetStatus('waitlisted')}>
              Reinstate to waitlist
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
