import Link from 'next/link'
import { count, eq } from 'drizzle-orm'
import { db } from '@grassroots/db'
import { jobPostings, jobApplications } from '@grassroots/db/schema'
import s from './careers.module.css'

const STATUS_BADGE: Record<string, string> = {
  published: 'badge-accent',
  draft: 'badge-muted',
  closed: 'badge-default',
}

const STATUS_LABEL: Record<string, string> = {
  published: 'Published',
  draft: 'Draft',
  closed: 'Closed',
}

export default async function AdminPostingsPage() {
  const rows = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      department: jobPostings.department,
      location: jobPostings.location,
      employmentType: jobPostings.employmentType,
      status: jobPostings.status,
      applicationCount: count(jobApplications.id),
    })
    .from(jobPostings)
    .leftJoin(jobApplications, eq(jobApplications.postingId, jobPostings.id))
    .groupBy(jobPostings.id)

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Postings</h1>
          <p className={s.subtitle}>Manage open roles shown on the public careers page.</p>
        </div>
        <Link href="/admin/careers/new" className="btn btn-primary">
          <i className="ti ti-plus" aria-hidden="true" />
          New posting
        </Link>
      </div>

      <div className={s.tableCard}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th className={s.right}>Applications</th>
              <th className={s.actionCol}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className={s.roleCell}>
                    <span className={s.roleTitle}>{p.title}</span>
                    <span className={s.roleMeta}>{[p.location, p.employmentType].filter(Boolean).join(' · ')}</span>
                  </div>
                </td>
                <td className={s.department}>{p.department}</td>
                <td><span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span></td>
                <td className={s.right}>
                  <Link href={`/admin/careers/${p.id}/applications`} className={s.rowLink}>
                    {p.applicationCount}
                  </Link>
                </td>
                <td className={s.right}>
                  <Link href={`/admin/careers/${p.id}/edit`} className={s.rowAction} aria-label="Edit posting">
                    <i className="ti ti-pencil" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
