'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthModal } from '@/components/auth/auth-modal'
import { Toaster } from '@/components/ui/toast'
import { MOCK_PLATFORM_STATS } from '@/lib/mock-data'

// Amendment 01 — updated copy and value props
const VALUE_PROPS = [
  {
    icon: 'pencil',
    title: 'Build openly',
    body: 'What you shipped, what you broke, what you learned, and what you imagine. Your journey, in one place.',
  },
  {
    icon: 'users-group',
    title: 'Build together',
    body: 'Create communities that follow the development of group projects and products. Talking to your audience has never been easier.',
  },
  {
    icon: 'message-circle',
    title: 'Join the conversation',
    body: 'Your projects surface to the people most likely to care — not by algorithm, but by interest graph.',
  },
]

const FOOTER_LINKS = ['Careers', 'Terms of service', 'Guidelines', 'Privacy']

function formatStat(n: number): string {
  return n.toLocaleString('en-US')
}

function LandingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authMode, setAuthMode] = useState<'signup' | 'login' | null>(null)

  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'login' || auth === 'signup') {
      setAuthMode(auth)
    }
  }, [searchParams])

  function openAuth(mode: 'signup' | 'login') {
    setAuthMode(mode)
    router.replace(`/?auth=${mode}`, { scroll: false })
  }

  function closeAuth() {
    setAuthMode(null)
    router.replace('/', { scroll: false })
  }

  const stats = MOCK_PLATFORM_STATS

  return (
    <>
      <Toaster />

      {/* Sticky header — 60px, wordmark hard-left, auth hard-right */}
      <header
        className="sticky top-0 flex items-center"
        style={{
          height: '60px',
          background: 'var(--color-surface)',
          borderBottom: 'var(--border-default)',
          zIndex: 'var(--z-sticky)',
        }}
      >
        <div className="container-page flex items-center justify-between">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              color: 'var(--color-ink)',
              lineHeight: 1,
            }}
          >
            Grassroots
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => openAuth('login')} className="btn btn-ghost btn-sm">
              Log in
            </button>
            <button onClick={() => openAuth('signup')} className="btn btn-primary btn-sm">
              Sign up
            </button>
          </div>
        </div>
      </header>

      <main className="container-page">
        {/* Hero */}
        <section className="section-hero">
          <div className="hero-grid">
            {/* Left copy */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col gap-5"
            >
              {/* Eyebrow — Amendment 01: "A home for creators" */}
              <p
                style={{
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--weight-medium)',
                  letterSpacing: 'var(--tracking-label)',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                }}
              >
                A home for creators
              </p>

              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '52px',
                  fontWeight: 400,
                  lineHeight: 1.04,
                  letterSpacing: '-0.01em',
                  color: 'var(--color-ink)',
                }}
              >
                Share what you&apos;re building.
              </h1>

              {/* Paragraph — Amendment 01: new copy */}
              <p
                style={{
                  fontSize: '17px',
                  color: 'var(--color-ink-soft)',
                  lineHeight: 'var(--leading-body)',
                  maxWidth: '420px',
                }}
              >
                Grassroots sits at the center of social enterprise in AI. Share what
                you&apos;re working on, connect with likeminded individuals, dream big.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                <button onClick={() => openAuth('signup')} className="btn btn-primary btn-lg">
                  Create your account
                </button>
                <button onClick={() => openAuth('login')} className="btn btn-secondary btn-lg">
                  Log in
                </button>
              </div>

              <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-secondary)' }}>
                Free to join. No ads.
              </p>
            </motion.div>

            {/* Right column — Amendment 01: live stats card replaces faux feed preview */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05, ease: 'easeOut' }}
            >
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: 'var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px 28px',
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '28px',
                  }}
                >
                  {/* Sage live-dot */}
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '999px',
                      background: 'var(--color-accent)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--text-small)',
                      fontWeight: 'var(--weight-medium)',
                      color: 'var(--color-ink)',
                    }}
                  >
                    Live on Grassroots
                  </span>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {[
                    { value: stats.usersOnline, label: 'Users online', icon: 'user' },
                    { value: stats.activeCommunities, label: 'Active communities', icon: 'users-group' },
                    { value: stats.ongoingThreads, label: 'Ongoing threads', icon: 'message-circle' },
                  ].map(({ value, label, icon }) => (
                    <div
                      key={label}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '36px',
                            fontWeight: 400,
                            lineHeight: 1.1,
                            color: 'var(--color-ink)',
                          }}
                        >
                          {formatStat(value)}
                        </p>
                        <p
                          style={{
                            fontSize: 'var(--text-body)',
                            color: 'var(--color-secondary)',
                            marginTop: '2px',
                          }}
                        >
                          {label}
                        </p>
                      </div>
                      <i
                        className={`ti ti-${icon}`}
                        style={{ fontSize: '28px', color: 'var(--color-accent)', flexShrink: 0 }}
                        aria-hidden="true"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Value props — Amendment 01: all three retitled/rewritten */}
        <section className="section-pad" style={{ borderTop: 'var(--border-default)' }}>
          <div className="value-props-grid">
            {VALUE_PROPS.map((vp, i) => (
              <motion.div
                key={vp.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 + i * 0.05 }}
                className="flex flex-col gap-3"
              >
                <i
                  className={`ti ti-${vp.icon}`}
                  style={{ fontSize: '22px', color: 'var(--color-accent)' }}
                  aria-hidden="true"
                />
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 'var(--weight-medium)',
                    color: 'var(--color-ink)',
                  }}
                >
                  {vp.title}
                </h3>
                <p
                  style={{
                    fontSize: 'var(--text-body)',
                    color: 'var(--color-secondary)',
                    lineHeight: 'var(--leading-body)',
                  }}
                >
                  {vp.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA band — unchanged per spec */}
        <section className="section-pad">
          <div
            className="flex flex-col items-center text-center gap-4"
            style={{
              border: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '56px 40px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '34px',
                fontWeight: 400,
                color: 'var(--color-ink)',
              }}
            >
              Ready to build in public?
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--color-secondary)',
                maxWidth: '420px',
                lineHeight: 'var(--leading-body)',
              }}
            >
              Join thousands of AI builders sharing what they&apos;re working on.
            </p>
            <button
              onClick={() => openAuth('signup')}
              className="btn btn-primary btn-lg"
              style={{ marginTop: '8px' }}
            >
              Create your account
            </button>
          </div>
        </section>
      </main>

      {/* Footer — Amendment 01: Careers · Terms of service · Guidelines · Privacy */}
      <footer
        style={{
          borderTop: 'var(--border-default)',
          background: 'var(--color-surface)',
          paddingTop: '20px',
          paddingBottom: '20px',
        }}
      >
        <div className="container-page flex items-center justify-between">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              color: 'var(--color-ink)',
            }}
          >
            Grassroots
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {FOOTER_LINKS.map((label) => (
              <Link key={label} href="#" className="navbar-link">
                {label}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>
            © 2026 Grassroots
          </p>
        </div>
      </footer>

      <AuthModal
        open={authMode !== null}
        initialMode={authMode ?? 'signup'}
        onClose={closeAuth}
        onSuccess={() => router.push('/feed')}
      />
    </>
  )
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingInner />
    </Suspense>
  )
}
