import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { getDataClient } from '@/lib/data'
import { ApplyForm } from './apply-form'
import s from './page.module.css'

export default async function CareersPostingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const posting = await getDataClient().getJobPostingBySlug(slug)
  if (!posting) notFound()

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href="/" className={s.wordmark}>Grassroots</Link>
        <Link href="/careers" className={s.backLink}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          All roles
        </Link>
      </nav>

      <main className={s.main}>
        <div className={s.postingHeader}>
          <h1 className={s.heading}>{posting.title}</h1>
          <div className={s.badges}>
            {posting.department && (
              <span className="badge badge-default">
                <i className="ti ti-briefcase" aria-hidden="true" />
                {posting.department}
              </span>
            )}
            {posting.location && (
              <span className="badge badge-default">
                <i className="ti ti-map-pin" aria-hidden="true" />
                {posting.location}
              </span>
            )}
            {posting.employmentType && (
              <span className="badge badge-default">
                <i className="ti ti-clock" aria-hidden="true" />
                {posting.employmentType}
              </span>
            )}
          </div>
        </div>

        <div className={`jd ${s.description}`}>
          <ReactMarkdown>{posting.description}</ReactMarkdown>
        </div>

        <ApplyForm postingId={posting.id} />
      </main>

      <footer className={s.footer}>
        <span className={s.copyright}>&copy; 2026 Grassroots</span>
        <div className={s.footerLinks}>
          <Link href="/terms" className={s.footerLink}>Terms of service</Link>
          <Link href="/privacy" className={s.footerLink}>Privacy policy</Link>
          <Link href="/careers" className={s.footerLink}>Careers</Link>
          <a href="#" className={s.footerLink}>Contribute</a>
        </div>
      </footer>
    </div>
  )
}
