'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { NotificationPanel } from '@/components/notifications/notification-panel'

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
    <header className="navbar" style={{ padding: 0 }}>
      <div className="container-page flex items-center justify-between h-full">
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
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="btn btn-ghost btn-icon"
                aria-label="Notifications"
              >
                <i className="ti ti-bell text-[18px]" aria-hidden="true" />
              </button>
              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[var(--z-overlay)]"
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
