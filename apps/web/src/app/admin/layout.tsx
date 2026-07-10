import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@grassroots/db'
import { AdminNav } from './nav'
import s from './layout.module.css'

export const maxDuration = 30

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const row = user
    ? await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.authId, user.id),
        columns: { id: true, displayName: true },
      })
    : null

  const profile = row
    ? await db.query.userProfiles.findFirst({
        where: (p, { eq }) => eq(p.userId, row.id),
        columns: { displayName: true },
      })
    : null

  const name = profile?.displayName ?? row?.displayName ?? 'Admin'
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <div className={s.brand}>
          <span className={s.wordmark}>Grassroots</span>
          <span className="badge badge-muted">Admin</span>
        </div>

        <AdminNav />

        <div className={s.account}>
          <div className={s.avatar}>{initials}</div>
          <div className={s.accountInfo}>
            <p className={s.accountName}>{name}</p>
            <p className={s.accountRole}>Administrator</p>
          </div>
          <Link href="/feed" className={s.exitLink} aria-label="Exit admin">
            <i className="ti ti-logout" aria-hidden="true" />
          </Link>
        </div>
      </aside>

      <div className={s.content}>{children}</div>
    </div>
  )
}
