import Link from 'next/link'
import { getDataClient } from '@/lib/data'
import { NotifyForm } from './notify-form'
import s from './page.module.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Careers — Grassroots',
}

export default async function CareersPage() {
  const postings = await getDataClient().getPublishedJobPostings()
  const hasPostings = postings.length > 0

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href="/" className={s.wordmark}>Grassroots</Link>
        <Link href="/" className={s.backLink}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Back to home
        </Link>
      </nav>

      <main className={`${s.main} ${hasPostings ? s.mainListing : ''}`}>
        <div className={s.hero}>
          <p className={s.eyebrow}>Careers</p>
          <h1 className={s.heading}>We&rsquo;re a small team building something we care about.</h1>
          {hasPostings ? (
            <p className={s.body}>
              We hire slowly and intentionally. When a role opens, we&rsquo;re looking for
              people who genuinely believe in what we&rsquo;re building.
            </p>
          ) : (
            <p className={s.body}>
              No open roles right now — but that&rsquo;ll change. When we&rsquo;re ready to
              grow, we want to find people who genuinely believe in what we&rsquo;re doing.
            </p>
          )}
        </div>

        {hasPostings ? (
          <div className={s.listing}>
            <p className={s.listingLabel}>
              {postings.length} open {postings.length === 1 ? 'role' : 'roles'}
            </p>
            <div className={s.roleList}>
              {postings.map((job) => (
                <Link key={job.id} href={`/careers/${job.slug}`} className={s.roleCard}>
                  <div className={s.roleCardInfo}>
                    <span className={s.roleTitle}>{job.title}</span>
                    <div className={s.roleMeta}>
                      {job.department && <span>{job.department}</span>}
                      {job.department && (job.location || job.employmentType) && <span className={s.roleMetaDivider}>·</span>}
                      {job.location && <span>{job.location}</span>}
                      {job.location && job.employmentType && <span className={s.roleMetaDivider}>·</span>}
                      {job.employmentType && <span>{job.employmentType}</span>}
                    </div>
                  </div>
                  <i className="ti ti-arrow-right" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <NotifyForm />
      </main>

      <footer className={s.footer}>
        <span className={s.copyright}>&copy; 2026 Grassroots</span>
        <div className={s.footerLinks}>
          <Link href="/terms" className={s.footerLink}>Terms of service</Link>
          <Link href="/privacy" className={s.footerLink}>Privacy policy</Link>
          <Link href="/careers" className={`${s.footerLink} ${s.footerLinkActive}`}>Careers</Link>
          <a href="#" className={s.footerLink}>Contribute</a>
        </div>
      </footer>
    </div>
  )
}
