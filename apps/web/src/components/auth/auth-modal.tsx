'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import s from './auth-modal.module.css'

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
            className={s.scrim}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={s.panel}
          >
            <h2 className={s.heading}>
              {mode === 'signup' ? 'Join Grassroots' : 'Welcome back'}
            </h2>
            <p className={s.subtitle}>
              {mode === 'signup'
                ? 'A home for AI builders.'
                : 'Sign in to your account.'}
            </p>

            <form onSubmit={handleSubmit} className={s.form}>
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

              <Button type="submit" size="lg" loading={loading} className={s.submitBtn}>
                {mode === 'signup' ? 'Create account' : 'Log in'}
              </Button>
            </form>

            <p className={s.footer}>
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={s.footerLink}
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
                    className={s.footerLink}
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
