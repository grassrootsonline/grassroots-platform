'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ROUTES = [
  { href: '/', icon: 'home-2', label: 'Landing' },
  { href: '/feed', icon: 'layout-list', label: 'Feed' },
  { href: '/feed/p1', icon: 'message-circle', label: 'Thread' },
  { href: '/profile/alexkim', icon: 'user-circle', label: 'Profile' },
]

export function DevNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 'var(--z-toast)' as never,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      {/* Route panel */}
      {open && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: 'var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-overlay)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '160px',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--color-accent)',
              letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase',
              padding: '4px 10px 6px',
            }}
          >
            Dev nav
          </p>
          {ROUTES.map(({ href, icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-body)',
                  fontWeight: active ? 'var(--weight-medium)' : 'var(--weight-regular)',
                  color: active ? 'var(--color-ink)' : 'var(--color-secondary)',
                  background: active ? 'var(--color-accent-mist)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 120ms ease, color 120ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--color-canvas)'
                    e.currentTarget.style.color = 'var(--color-ink)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--color-secondary)'
                  }
                }}
              >
                <i className={`ti ti-${icon}`} style={{ fontSize: '15px', flexShrink: 0 }} aria-hidden="true" />
                {label}
                {active && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      width: '5px',
                      height: '5px',
                      borderRadius: '999px',
                      background: 'var(--color-accent)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close dev nav' : 'Open dev nav'}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '999px',
          background: open ? 'var(--color-ink)' : 'var(--color-accent)',
          color: 'var(--color-canvas)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-overlay)',
          transition: 'background 120ms ease, opacity 120ms ease',
          flexShrink: 0,
        }}
      >
        <i
          className={open ? 'ti ti-x' : 'ti ti-layout-grid'}
          style={{ fontSize: '16px' }}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
