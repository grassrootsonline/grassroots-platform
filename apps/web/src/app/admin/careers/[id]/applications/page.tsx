import Link from 'next/link'
import { notFound } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { db } from '@grassroots/db'
import { jobApplications } from '@grassroots/db/schema'
import s from '../../careers.module.css'

export default async function PostingApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const posting = await db.query.jobPostings.findFirst({
    where: (p, { eq }) => eq(p.id, id),
    columns: { title: true, department: true },
  })
  if (!posting) notFound()

  const applications = await db.query.jobApplications.findMany({
    where: eq(jobApplications.postingId, id),
    orderBy: desc(jobApplications.createdAt),
  })

  return (
    <div className={s.page}>
      <Link href="/admin/careers" className={s.backLink}>
        <i className="ti ti-arrow-left" aria-hidden="true" />
        Back to postings
      </Link>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Applications</h1>
          <p className={s.subtitle}>
            {posting.title}
            {posting.department && <> <span>&middot;</span> {posting.department}</>}
          </p>
        </div>
      </div>

      {applications.length > 0 ? (
        <div className={s.tableCard}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Portfolio / resume</th>
                <th>Note</th>
                <th className={s.right}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className={s.roleCell}>
                      <span className={s.roleTitle}>{a.name}</span>
                      <span className={s.roleMeta}>{a.email}</span>
                    </div>
                  </td>
                  <td>
                    {a.portfolioUrl ? (
                      <a href={a.portfolioUrl} className={s.rowLink} target="_blank" rel="noopener noreferrer">
                        {a.portfolioUrl}
                      </a>
                    ) : null}
                  </td>
                  <td className={s.department}>{a.note}</td>
                  <td className={s.right}>{a.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={s.emptyState}>
          <i className="ti ti-inbox" aria-hidden="true" />
          <p className={s.emptyTitle}>No applications yet</p>
          <p className={s.emptyBody}>When people apply to this role, they&rsquo;ll show up here.</p>
        </div>
      )}
    </div>
  )
}
