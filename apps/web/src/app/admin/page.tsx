import { count, eq, gte } from 'drizzle-orm'
import { db } from '@grassroots/db'
import { users, careerInterestSignups, jobPostings } from '@grassroots/db/schema'
import s from './page.module.css'

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

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [[newSignups], [talentSignups], [openPostings], statusRows] = await Promise.all([
    db.select({ n: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
    db.select({ n: count() }).from(careerInterestSignups),
    db.select({ n: count() }).from(jobPostings).where(eq(jobPostings.status, 'published')),
    db.select({ status: users.accountStatus, n: count() }).from(users).groupBy(users.accountStatus),
  ])

  const statusCounts: Record<string, number> = { waitlisted: 0, active: 0, suspended: 0 }
  for (const row of statusRows) statusCounts[row.status] = row.n
  const totalUsers = Object.values(statusCounts).reduce((a, b) => a + b, 0)

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>Dashboard</h1>
        <p className={s.subtitle}>An overview of Grassroots — early access.</p>
      </div>

      <div className={s.statGrid}>
        <div className={s.statCard}>
          <span className={s.statLabel}>New signups <span className={s.statDivider}>·</span> 30 days</span>
          <span className={s.statValue}>{newSignups.n}</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statLabel}>Talent list signups</span>
          <span className={s.statValue}>{talentSignups.n}</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statLabel}>Open postings</span>
          <span className={s.statValue}>{openPostings.n}</span>
        </div>
      </div>

      <div className={s.statCard}>
        <div className={s.totalRow}>
          <span className={s.statLabel}>Total users</span>
          <span className={s.totalValue}>{totalUsers}</span>
        </div>
        <div className={s.statusBreakdown}>
          {(['waitlisted', 'active', 'suspended'] as const).map((status) => (
            <div key={status} className={s.statusItem}>
              <span className={s.statusCount}>{statusCounts[status]}</span>
              <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
