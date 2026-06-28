'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { NotificationPanel } from '@/components/notifications/notification-panel'
import s from './navbar.module.css'

interface NavbarProps {
  user?: {
    name: string
    username: string
    avatarUrl?: string | null
  } | null
}

export function Navbar({ user }: NavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="navbar">
      <div className={`container-page ${s.inner}`}>
      <Link
        href={user ? '/feed' : '/'}
        className="navbar-logo"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Grassroots
      </Link>

      <div className="navbar-actions">
        {user ? (
          <>
            <div className={s.notifWrapper}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="btn btn-ghost btn-icon"
                aria-label="Notifications"
              >
                <i className="ti ti-bell icon-md" aria-hidden="true" />
              </button>
              {notifOpen && (
                <>
                  <div
                    className={s.notifBackdrop}
                    onClick={() => setNotifOpen(false)}
                  />
                  <NotificationPanel onClose={() => setNotifOpen(false)} />
                </>
              )}
            </div>

            <Link href={`/profile/${user.username}`}>
              <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            </Link>
          </>
        ) : (
          <>
            <Link href="/?auth=login" className="btn btn-ghost btn-sm">
              Log in
            </Link>
            <Link href="/?auth=signup" className="btn btn-primary btn-sm">
              Sign up
            </Link>
          </>
        )}
      </div>
      </div>
    </header>
  )
}
