import Link from 'next/link'
import { POLICY_EFFECTIVE_DATE } from '@/constants/legal'
import s from './legal-page-shell.module.css'

interface LegalPageShellProps {
  title: string
  children: React.ReactNode
}

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <Link href="/" className={s.wordmark}>Grassroots</Link>
        <Link href="/" className={s.backLink}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
          Back to home
        </Link>
      </nav>

      <main className={s.main}>
        <div className={s.header}>
          <h1 className={s.title}>{title}</h1>
          <p className={s.effectiveDate}>Effective date: {POLICY_EFFECTIVE_DATE}</p>
        </div>

        <div className={s.legalNotice}>
          <i className="ti ti-alert-circle" aria-hidden="true" />
          <p>
            This page is pending legal review and is not launch-ready. Placeholder
            legal facts (entity name, jurisdiction, contact email, effective date)
            are unresolved.
          </p>
        </div>

        <div className={s.prose}>{children}</div>
      </main>

      <footer className={s.footer}>
        <span className={s.copyright}>&copy; 2026 Grassroots</span>
        <div className={s.footerLinks}>
          <Link href="/terms" className={s.footerLink}>Terms of service</Link>
          <Link href="/privacy" className={s.footerLink}>Privacy policy</Link>
        </div>
      </footer>
    </div>
  )
}
