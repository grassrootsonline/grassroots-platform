'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
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

      <div className={s.projects}>
        <p className={`text-label ${s.projectsLabel}`}>
          Your projects
        </p>
        {MOCK_PROJECTS.map((p) => (
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
