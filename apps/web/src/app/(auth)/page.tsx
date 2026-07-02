import Link from 'next/link'
import { MOCK_PLATFORM_STATS } from '@/lib/mock-data'
import s from './page.module.css'

const VALUE_PROPS = [
  {
    icon: 'eye',
    title: 'Build openly',
    body: 'Share your work as it happens — updates, experiments, half-finished ideas. No polish required. The community values the process as much as the result.',
  },
  {
    icon: 'users',
    title: 'Build together',
    body: 'Find collaborators, ask for help, and follow along on others’ projects. Every post is an invitation to get involved — and the communities here take that seriously.',
  },
  {
    icon: 'messages',
    title: 'Join the conversation',
    body: 'Grassroots is organized around communities, not algorithms. Follow the people and topics that matter to you — and discover new ones through the work they share.',
  },
]

export default function LandingPage() {
  return (
    <div className={s.page}>

      {/* ── Sticky nav ── */}
      <nav className={s.nav}>
        <span className={s.wordmark}>Grassroots</span>
        <div className={s.navActions}>
          <Link href="/login" className="btn btn-ghost">Sign in</Link>
          <Link href="/signup" className="btn btn-primary">Create account</Link>
        </div>
      </nav>

      <main className={s.main}>

        {/* ── Hero ── */}
        <section className={s.heroSection}>
          <div className={s.heroGrid}>

            {/* Left copy */}
            <div className={`${s.heroCopy} animate-slide-up`}>
              <p className="text-label">A home for creators</p>
              <h1 className={s.heroHeading}>
                Where builders share<br />what they make
              </h1>
              <p className={s.heroSubtext}>
                The platform for makers, tinkerers, and community organizers. Share your work openly,
                find collaborators, and follow the projects that matter to you.
              </p>
              <div className={s.heroCtas}>
                <Link href="/signup" className="btn btn-primary btn-lg">Create account</Link>
                <Link href="/login" className="btn btn-ghost btn-lg">Sign in</Link>
              </div>
            </div>

            {/* Stats card */}
            <div className={`${s.statsCard} animate-slide-up`}>
              <p className={`text-label ${s.statsLabel}`}>Live on Grassroots</p>

              <div className={s.statRow}>
                <span className={s.statLbl}>Builders online</span>
                <span className={s.statNum}>{MOCK_PLATFORM_STATS.usersOnline.toLocaleString()}</span>
              </div>
              <div className={s.statRow}>
                <span className={s.statLbl}>Active communities</span>
                <span className={s.statNum}>{MOCK_PLATFORM_STATS.activeCommunities.toLocaleString()}</span>
              </div>
              <div className={`${s.statRow} ${s.statRowLast}`}>
                <span className={s.statLbl}>Ongoing threads</span>
                <span className={s.statNum}>{MOCK_PLATFORM_STATS.ongoingThreads.toLocaleString()}</span>
              </div>

              <div className={s.avatarStack}>
                <div className={s.avatarRow}>
                  <div className={s.miniAvatar}>MO</div>
                  <div className={s.miniAvatarOffset}>RC</div>
                  <div className={s.miniAvatarOffset}>TL</div>
                  <span className={s.avatarCaption}>&hellip;and many others</span>
                </div>
                <p className={s.statsNote}>
                  From urban foraging to repair cafés — communities doing real things.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Value props ── */}
        <section className={s.valueSection}>
          <div className={s.valueInner}>
            <div className={s.valueGrid}>
              {VALUE_PROPS.map((vp) => (
                <div key={vp.title} className={s.valueCard}>
                  <i className={`ti ti-${vp.icon} icon-lg ${s.valueCardIcon}`} aria-hidden="true" />
                  <h3 className={s.valueTitle}>{vp.title}</h3>
                  <p className={s.valueBody}>{vp.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
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
