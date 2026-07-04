'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import type { SidebarProject } from '@/lib/data'
import s from './left-rail.module.css'

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

interface LeftRailProps {
  user?: {
    name: string
    username: string
    avatarUrl?: string | null
  } | null
  projects: SidebarProject[]
}

export function LeftRail({ user, projects }: LeftRailProps) {
  const pathname = usePathname()

  return (
    <aside className={s.rail} aria-label="Primary navigation">
      <nav className={s.nav}>
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={[s.link, active ? s.linkActive : ''].filter(Boolean).join(' ')}
            >
              <i
                className={['ti', `ti-${icon}`, s.linkIcon, active ? s.linkIconActive : ''].filter(Boolean).join(' ')}
                aria-hidden="true"
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {projects.length > 0 && (
        <div className={s.projects}>
          <p className={`text-label ${s.projectsLabel}`}>
            Your projects
          </p>
          {projects.map((p) => (
            <Link
              key={p.slug}
              href={`/project/${p.slug}`}
              className={s.projectLink}
            >
              <i className={`ti ti-circle-dot ${s.projectIcon}`} aria-hidden="true" />
              {p.name}
            </Link>
          ))}
        </div>
      )}

      {user && (
        <div className={s.userChip}>
          <Link
            href={`/profile/${user.username}`}
            className={s.userChipLink}
          >
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className={s.userChipMeta}>
              <p className={s.userChipName}>{user.name}</p>
              <p className={s.userChipSub}>View profile</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  )
}
