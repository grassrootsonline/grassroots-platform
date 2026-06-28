'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

type AuthMode = 'signup' | 'login'

interface AuthModalProps {
  open: boolean
  initialMode?: AuthMode
  onClose: () => void
  onSuccess?: (mode: AuthMode) => void
}

export function AuthModal({ open, initialMode = 'signup', onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ displayName: '', email: '', password: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setLoading(false)
    toast(mode === 'signup' ? 'Account created.' : 'Logged in.')
    onSuccess?.(mode)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-[rgba(28,43,26,0.32)] z-[var(--z-overlay)]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[11vh] left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-surface rounded-xl shadow-overlay z-[var(--z-modal)] p-7"
          >
            <h2
              className="text-[22px] text-ink mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {mode === 'signup' ? 'Join Grassroots' : 'Welcome back'}
            </h2>
            <p className="text-body text-secondary mb-6">
              {mode === 'signup'
                ? 'A home for AI builders.'
                : 'Sign in to your account.'}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'signup' && (
                <Input
                  label="Display name"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  placeholder="Ada Lovelace"
                  required
                  autoFocus
                />
              )}
              <Input
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoFocus={mode === 'login'}
              />
              <Input
                label="Password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />

              <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
                {mode === 'signup' ? 'Create account' : 'Log in'}
              </Button>
            </form>

            <p className="mt-5 text-center text-small text-secondary">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-accent hover:underline"
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  New to Grassroots?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-accent hover:underline"
                  >
                    Create one
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
