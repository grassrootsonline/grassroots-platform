'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'

interface NavItem {
  href: string
  icon: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/feed', icon: 'home', label: 'Feed' },
  { href: '/explore', icon: 'compass', label: 'Explore' },
  { href: '/projects', icon: 'folder', label: 'Projects' },
  { href: '/communities', icon: 'users', label: 'Communities' },
  { href: '/saved', icon: 'bookmark', label: 'Saved' },
]

const MOCK_PROJECTS = [
  { name: 'Inference Stack', slug: 'inference-stack' },
  { name: 'PromptKit', slug: 'promptkit' },
]

interface LeftRailProps {
  user?: {
    name: string
    username: string
    avatarUrl?: string | null
  } | null
}

export function LeftRail({ user }: LeftRailProps) {
  const pathname = usePathname()

  return (
    <aside
      className="w-[188px] flex-shrink-0 sticky top-[80px] self-start h-[calc(100vh-80px)] flex flex-col"
      aria-label="Primary navigation"
    >
      {/* Nav links */}
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-[14px] transition-all duration-[120ms]',
                active
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-ink)] font-[500]'
                  : 'text-[var(--color-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)]',
              ].join(' ')}
            >
              <i
                className={[
                  `ti ti-${icon} text-[18px]`,
                  active ? 'text-[var(--color-accent)]' : '',
                ].join(' ')}
                aria-hidden="true"
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Projects */}
      <div className="mt-5">
        <p className="px-3 text-[11px] font-[500] uppercase tracking-[0.08em] text-[var(--color-accent)] mb-1">
          Your projects
        </p>
        {MOCK_PROJECTS.map((p) => (
          <Link
            key={p.slug}
            href={`/project/${p.slug}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] text-[13px] text-[var(--color-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-all duration-[120ms]"
          >
            <i className="ti ti-circle-dot text-[var(--color-accent)] text-[14px]" aria-hidden="true" />
            {p.name}
          </Link>
        ))}
      </div>

      {/* User chip */}
      {user && (
        <div className="mt-auto pb-4">
          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface)] transition-all duration-[120ms]"
          >
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="text-[13px] font-[500] text-[var(--color-ink)] truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-[var(--color-secondary)]">View profile</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  )
}
