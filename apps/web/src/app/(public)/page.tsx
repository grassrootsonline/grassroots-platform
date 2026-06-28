'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthModal } from '@/components/auth/auth-modal'
import { Toaster } from '@/components/ui/toast'
import { MOCK_POSTS } from '@/lib/mock-data'
import s from './page.module.css'

const VALUE_PROPS = [
  {
    icon: 'rocket',
    title: 'Show your work',
    body: 'Post updates on what you\'re building. Link your projects, share progress, and get feedback from people who get it.',
  },
  {
    icon: 'users',
    title: 'Find your people',
    body: 'Follow builders working on the same problems. Join communities organized around tools, research areas, and ideas.',
  },
  {
    icon: 'eye',
    title: 'Get seen',
    body: 'Your projects surface to the people most likely to care — not by algorithm, but by interest graph.',
  },
]

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

  const previewPosts = MOCK_POSTS.slice(0, 2)

  return (
    <>
      <Toaster />

      {/* Sticky header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
          height: '60px',
          background: 'var(--color-surface)',
          borderBottom: 'var(--border-default)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="container-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              className={s.heroMotion}
            >
              <p
                style={{
                  fontSize: 'var(--text-label)',
                  fontWeight: 'var(--weight-medium)',
                  letterSpacing: 'var(--tracking-label)',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                }}
              >
                A home for builders
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
              <p
                style={{
                  fontSize: '17px',
                  color: 'var(--color-ink-soft)',
                  lineHeight: 'var(--leading-body)',
                  maxWidth: '420px',
                }}
              >
                Grassroots is where AI builders share projects, ideas, and progress with
                people who actually care.
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

            {/* Right product preview */}
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
                  overflow: 'hidden',
                }}
              >
                {/* Faux header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: 'var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-border-strong)' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-border-strong)' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-border-strong)' }} />
                  <div style={{ marginLeft: 'auto', fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>grassroots.ai</div>
                </div>
                {/* Preview posts */}
                <div
                  style={{
                    background: 'var(--color-canvas)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {previewPosts.map((post) => (
                    <div
                      key={post.id}
                      style={{
                        background: 'var(--color-surface)',
                        border: 'var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '14px',
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--color-accent-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--text-label)',
                            fontWeight: 'var(--weight-medium)',
                            color: 'var(--color-accent-ink)',
                          }}
                        >
                          {post.author.name[0]}
                        </div>
                        <span style={{ fontSize: 'var(--text-small)', fontWeight: 'var(--weight-medium)', color: 'var(--color-ink)' }}>
                          {post.author.name}
                        </span>
                        <span style={{ fontSize: 'var(--text-small)', color: 'var(--color-secondary)' }}>· 2h</span>
                      </div>
                      <p
                        style={{
                          fontSize: 'var(--text-small)',
                          color: 'var(--color-ink-soft)',
                          lineHeight: '1.55',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {post.content}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                        <span style={{ fontSize: 'var(--text-small)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="ti ti-heart icon-sm" /> {post.reactionCount}
                        </span>
                        <span style={{ fontSize: 'var(--text-small)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="ti ti-message-circle icon-sm" /> {post.commentCount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Value props */}
        <section className="section-pad" style={{ borderTop: 'var(--border-default)' }}>
          <div className="value-props-grid">
            {VALUE_PROPS.map((vp, i) => (
              <motion.div
                key={vp.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 + i * 0.05 }}
                className={s.valueProp}
              >
                <i
                  className={`ti ti-${vp.icon} icon-lg`}
                  style={{ color: 'var(--color-accent)' }}
                  aria-hidden="true"
                />
                <h3 style={{ fontSize: '17px', fontWeight: 'var(--weight-medium)', color: 'var(--color-ink)' }}>{vp.title}</h3>
                <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-secondary)', lineHeight: 'var(--leading-body)' }}>
                  {vp.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="section-pad">
          <div
            className={s.ctaContent}
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

      {/* Footer */}
      <footer
        style={{
          borderTop: 'var(--border-default)',
          background: 'var(--color-surface)',
          paddingTop: '20px',
          paddingBottom: '20px',
        }}
      >
        <div className="container-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              color: 'var(--color-ink)',
            }}
          >
            Grassroots
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
            {['About', 'Communities', 'Guidelines', 'Privacy'].map((link) => (
              <Link key={link} href="#" className="navbar-link">
                {link}
              </Link>
            ))}
          </div>
          <p style={{ fontSize: 'var(--text-small)', color: 'var(--color-muted)' }}>© 2026 Grassroots</p>
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
