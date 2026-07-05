import Link from 'next/link'
import { NotifyForm } from './notify-form'
import s from './page.module.css'

export const metadata = {
  title: 'Careers — Grassroots',
}

export default function CareersPage() {
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
        <div className={s.hero}>
          <p className={s.eyebrow}>Careers</p>
          <h1 className={s.heading}>We&rsquo;re a small team building something we care about.</h1>
          <p className={s.body}>
            No open roles right now — but that&rsquo;ll change. When we&rsquo;re ready to
            grow, we want to find people who genuinely believe in what we&rsquo;re doing.
          </p>
        </div>

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
