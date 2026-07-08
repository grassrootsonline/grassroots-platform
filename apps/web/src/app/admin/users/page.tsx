import { db } from '@grassroots/db'
import { users } from '@grassroots/db/schema'
import { desc, eq } from 'drizzle-orm'
import { UserRow } from './user-row'
import s from './users.module.css'

const STATUS_BADGE: Record<string, string> = {
  waitlisted: 'badge-muted',
  active: 'badge-accent',
  suspended: 'badge-danger',
}
const STATUS_LABEL: Record<string, string> = {
  waitlisted: 'Waitlisted',
  active: 'Active',
  suspended: 'Suspended',
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const filter = status === 'waitlisted' || status === 'active' || status === 'suspended' ? status : undefined

  // Note: email deliberately not selected here — the admin user list doesn't
  // need it, and there's no reason to pull it into this view just because it
  // exists on the table (see CLAUDE.md's user data conventions on public-facing
  // surfaces; this keeps the same discipline for an admin-only query too).
  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      accountStatus: users.accountStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(filter ? eq(users.accountStatus, filter) : undefined)
    .orderBy(desc(users.createdAt))

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Users</h1>
          <p className={s.subtitle}>Manage account access — activate waitlisted users, suspend if needed.</p>
        </div>
      </div>

      <div className={`tab-list-pill ${s.filterBar}`}>
        {(['all', 'waitlisted', 'active', 'suspended'] as const).map((f) => (
          <a
            key={f}
            href={f === 'all' ? '/admin/users' : `/admin/users?status=${f}`}
            className={`tab-pill ${(filter ?? 'all') === f ? 'active' : ''}`}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </a>
        ))}
      </div>

      <div className={s.tableCard}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Joined</th>
              <th className={s.actionCol}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <UserRow key={u.id} user={u} statusBadge={STATUS_BADGE} statusLabel={STATUS_LABEL} />
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
            <p className="empty-state-body">No users match this filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
