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
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-md text-body transition-colors duration-fast',
                active
                  ? 'bg-accent-subtle text-ink font-medium'
                  : 'text-secondary hover:text-ink hover:bg-surface',
              ].join(' ')}
            >
              <i
                className={[
                  `ti ti-${icon} text-[18px]`,
                  active ? 'text-accent' : '',
                ].join(' ')}
                aria-hidden="true"
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-5">
        <p className="px-3 text-label font-medium uppercase tracking-label text-accent mb-1">
          Your projects
        </p>
        {MOCK_PROJECTS.map((p) => (
          <Link
            key={p.slug}
            href={`/project/${p.slug}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-small text-secondary hover:text-ink hover:bg-surface transition-colors duration-fast"
          >
            <i className="ti ti-circle-dot text-accent text-[14px]" aria-hidden="true" />
            {p.name}
          </Link>
        ))}
      </div>

      {user && (
        <div className="mt-auto pb-4">
          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-surface transition-colors duration-fast"
          >
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="text-small font-medium text-ink truncate">{user.name}</p>
              <p className="text-label text-secondary">View profile</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  )
}
