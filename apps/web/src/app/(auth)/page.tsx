import Link from 'next/link'
import { getDataClient } from '@/lib/data'
import { LeafBackground } from '@/components/layout/leaf-background'
import s from './page.module.css'

// The landing page has no auth/cookie reads, so Next would otherwise statically
// optimize it and run getWaitlistCount() at build time — where DB credentials
// aren't available, breaking the build (see handoff 029 follow-up). Force
// per-request rendering, matching /feed and /profile which are already dynamic
// because their data calls go through cookie-reading auth helpers.
export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const waitlistCount = await getDataClient().getWaitlistCount()

  return (
    <div className={s.page}>
      <LeafBackground />

      {/* ── Sticky nav ── */}
      <nav className={s.nav}>
        <span className={s.wordmark}>Grassroots</span>
        <p className={s.navSignin}>
          Have an account? <Link href="/login" className={s.inlineLink}>Sign in</Link>
        </p>
      </nav>

      <main className={s.main}>

        {/* ── Hero ── */}
        <section className={s.heroSection}>
          <div className={s.heroGrid}>

            {/* Left copy */}
            <div className={`${s.heroCopy} animate-slide-up`}>
              <h1 className={s.heroHeading}>
                Build.<br />Share.<br /><span className={s.heroHeadingAccent}>Connect.</span>
              </h1>
              <p className={s.heroSubtext}>
                The social platform for creators. Talk about the problems you&rsquo;re
                solving, build your network, and share your story.
              </p>
              <div className={s.heroCtas}>
                <Link href="/signup" className="btn btn-primary">Sign up</Link>
              </div>
            </div>

            {/* Waitlist stat */}
            <div className={`${s.statBlock} animate-slide-up`}>
              <span className={s.statNum}>{waitlistCount.toLocaleString()}</span>
              <p className={s.statLabel}>waitlisted users</p>
            </div>
          </div>
        </section>

        {/* ── Open source ── */}
        <section className={s.contentSection}>
          <div className={s.contentInner}>
            <div className={s.eyebrowRow}>
              <i className="ti ti-brand-github icon-md" aria-hidden="true" />
              <span className="text-label">Source available</span>
            </div>
            <h2 className={s.sectionHeading}>Built in public, for the public.</h2>
            <p className={s.sectionBody}>
              The full source is public and open to contribution. Not a permissive
              open-source license — see our LICENSE for what that means in practice.
            </p>
            <a
              href="https://github.com/grassrootsonline/grassroots-platform"
              className={s.sectionLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub <i className="ti ti-arrow-right" aria-hidden="true" />
            </a>
          </div>

          {/* ── Documentation ── */}
          <div className={`${s.contentInner} ${s.contentInnerRight}`}>
            <div className={s.eyebrowRow}>
              <span className="text-label">Documentation</span>
              <i className="ti ti-book icon-md" aria-hidden="true" />
            </div>
            <h2 className={s.sectionHeading}>Everything you need to get started.</h2>
            <p className={s.sectionBody}>
              Guides, API references, and contribution docs — coming soon.
            </p>
            {/* href intentionally "#" — repo visibility not yet confirmed (handoff 029) */}
            <a href="#" className={s.sectionLink}>
              <i className="ti ti-arrow-left" aria-hidden="true" /> Documentation
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className={s.footer}>
        <span className={s.copyright}>&copy; 2026 Grassroots</span>
        <div className={s.footerLinks}>
          <Link href="/terms" className={s.footerLink}>Terms of service</Link>
          <Link href="/privacy" className={s.footerLink}>Privacy policy</Link>
          <Link href="/careers" className={s.footerLink}>Careers</Link>
          {/* href intentionally "#" — repo visibility not yet confirmed (handoff 029) */}
          <a href="#" className={s.footerLink}>Contribute</a>
        </div>
      </footer>
    </div>
  )
}
