'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthModal } from '@/components/auth/auth-modal'
import { Toaster } from '@/components/ui/toast'
import { FeedCard } from '@/components/feed/feed-card'
import { MOCK_POSTS } from '@/lib/mock-data'

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
      <header className="sticky top-0 z-[var(--z-sticky)] h-[60px] bg-[var(--color-surface)] border-b border-[0.5px] border-[var(--color-border)] flex items-center">
        <div className="w-full max-w-[var(--content-max-width)] mx-auto px-5 flex items-center justify-between">
          <span
            className="text-[22px] text-[var(--color-ink)] leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Grassroots
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openAuth('login')}
              className="h-8 px-3.5 text-[13px] font-[500] text-[var(--color-ink)] hover:bg-[var(--color-accent-subtle)] rounded-[var(--radius-md)] flex items-center transition-all duration-[120ms]"
            >
              Log in
            </button>
            <button
              onClick={() => openAuth('signup')}
              className="h-8 px-3.5 text-[13px] font-[500] bg-[var(--color-ink)] text-[var(--color-canvas)] rounded-[var(--radius-md)] flex items-center hover:opacity-[0.88] transition-all duration-[120ms]"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[var(--content-max-width)] mx-auto px-5">
        {/* Hero */}
        <section className="pt-[72px] pb-[80px]">
          <div className="grid grid-cols-2 gap-[56px] items-center">
            {/* Left copy */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex flex-col gap-5"
            >
              <p className="text-[11px] font-[500] uppercase tracking-[0.08em] text-[var(--color-accent)]">
                A home for builders
              </p>
              <h1
                className="text-[52px] text-[var(--color-ink)] leading-[1.04] tracking-[-0.01em]"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}
              >
                Share what you&apos;re building.
              </h1>
              <p
                className="text-[17px] text-[var(--color-ink-soft)] leading-[var(--leading-body)]"
                style={{ maxWidth: '420px' }}
              >
                Grassroots is where AI builders share projects, ideas, and progress with
                people who actually care.
              </p>

              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => openAuth('signup')}
                  className="h-11 px-6 text-[15px] font-[500] bg-[var(--color-ink)] text-[var(--color-canvas)] rounded-[var(--radius-md)] hover:opacity-[0.88] active:opacity-[0.76] transition-all duration-[120ms]"
                >
                  Create your account
                </button>
                <button
                  onClick={() => openAuth('login')}
                  className="h-11 px-6 text-[15px] font-[500] text-[var(--color-ink)] border border-[0.5px] border-[var(--color-border-strong)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface)] transition-all duration-[120ms]"
                >
                  Log in
                </button>
              </div>
              <p className="text-[13px] text-[var(--color-secondary)]">
                Free to join. No ads.
              </p>
            </motion.div>

            {/* Right product preview */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05, ease: 'easeOut' }}
            >
              <div className="bg-[var(--color-surface)] border border-[0.5px] border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden">
                {/* Faux header */}
                <div className="px-4 py-3 border-b border-[0.5px] border-[var(--color-border)] flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-strong)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-strong)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-strong)]" />
                  <div className="ml-auto text-[12px] text-[var(--color-muted)]">grassroots.ai</div>
                </div>
                {/* Preview posts */}
                <div className="bg-[var(--color-canvas)] p-3 flex flex-col gap-2.5">
                  {previewPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-[var(--color-surface)] border border-[0.5px] border-[var(--color-border)] rounded-[var(--radius-lg)] p-3.5 pointer-events-none"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center text-[11px] font-[500] text-[var(--color-accent-ink)]">
                          {post.author.name[0]}
                        </div>
                        <span className="text-[13px] font-[500] text-[var(--color-ink)]">
                          {post.author.name}
                        </span>
                        <span className="text-[12px] text-[var(--color-secondary)]">· 2h</span>
                      </div>
                      <p className="text-[13px] text-[var(--color-ink-soft)] leading-[1.55] line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2.5">
                        <span className="text-[12px] text-[var(--color-secondary)] flex items-center gap-1">
                          <i className="ti ti-heart text-[14px]" /> {post.reactionCount}
                        </span>
                        <span className="text-[12px] text-[var(--color-secondary)] flex items-center gap-1">
                          <i className="ti ti-message-circle text-[14px]" /> {post.commentCount}
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
        <section className="border-t border-[0.5px] border-[var(--color-border)] py-[60px]">
          <div className="grid grid-cols-3 gap-[40px]">
            {VALUE_PROPS.map((vp, i) => (
              <motion.div
                key={vp.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 + i * 0.05 }}
                className="flex flex-col gap-3"
              >
                <i
                  className={`ti ti-${vp.icon} text-[22px] text-[var(--color-accent)]`}
                  aria-hidden="true"
                />
                <h3 className="text-[17px] font-[500] text-[var(--color-ink)]">{vp.title}</h3>
                <p className="text-[14px] text-[var(--color-secondary)] leading-[var(--leading-body)]">
                  {vp.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA band */}
        <section className="py-[60px]">
          <div className="border border-[0.5px] border-[var(--color-border)] rounded-[var(--radius-lg)] px-[40px] py-[56px] flex flex-col items-center text-center gap-4">
            <h2
              className="text-[34px] text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}
            >
              Ready to build in public?
            </h2>
            <p className="text-[15px] text-[var(--color-secondary)] max-w-[420px] leading-[var(--leading-body)]">
              Join thousands of AI builders sharing what they&apos;re working on.
            </p>
            <button
              onClick={() => openAuth('signup')}
              className="mt-2 h-11 px-6 text-[15px] font-[500] bg-[var(--color-ink)] text-[var(--color-canvas)] rounded-[var(--radius-md)] hover:opacity-[0.88] transition-all duration-[120ms]"
            >
              Create your account
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[0.5px] border-[var(--color-border)] bg-[var(--color-surface)] py-5">
        <div className="w-full max-w-[var(--content-max-width)] mx-auto px-5 flex items-center justify-between">
          <span
            className="text-[18px] text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Grassroots
          </span>
          <div className="flex items-center gap-5">
            {['About', 'Communities', 'Guidelines', 'Privacy'].map((link) => (
              <Link
                key={link}
                href="#"
                className="text-[13px] text-[var(--color-secondary)] hover:text-[var(--color-ink)] transition-colors duration-[120ms]"
              >
                {link}
              </Link>
            ))}
          </div>
          <p className="text-[13px] text-[var(--color-muted)]">© 2026 Grassroots</p>
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
