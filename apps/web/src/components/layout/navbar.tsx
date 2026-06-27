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
    <header
      className="sticky top-0 z-[var(--z-sticky)] h-[60px] bg-[var(--color-surface)] border-b border-[0.5px] border-[var(--color-border)] flex items-center"
      style={{ borderBottomWidth: '0.5px' }}
    >
      <div className="container-page flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href={user ? '/feed' : '/'}
          className="font-[var(--font-display)] text-[22px] text-[var(--color-ink)] leading-none hover:opacity-80 transition-opacity duration-[120ms]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Grassroots
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] transition-all duration-[120ms] focus-visible:shadow-[var(--focus-ring)] outline-none"
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

              {/* Avatar */}
              <Link href={`/profile/${user.username}`}>
                <Avatar src={user.avatarUrl} name={user.name} size="sm" />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/?auth=login"
                className="h-8 px-3.5 text-[13px] font-[500] text-[var(--color-ink)] hover:bg-[var(--color-accent-subtle)] rounded-[var(--radius-md)] flex items-center transition-all duration-[120ms]"
              >
                Log in
              </Link>
              <Link
                href="/?auth=signup"
                className="h-8 px-3.5 text-[13px] font-[500] bg-[var(--color-ink)] text-[var(--color-canvas)] rounded-[var(--radius-md)] flex items-center hover:opacity-[0.88] transition-all duration-[120ms]"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
