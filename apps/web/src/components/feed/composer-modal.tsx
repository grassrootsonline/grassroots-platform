'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

const MOCK_PROJECTS = [
  { id: '1', name: 'Inference Stack' },
  { id: '2', name: 'PromptKit' },
]

interface ComposerModalProps {
  open: boolean
  onClose: () => void
  onPublish: (post: { content: string; projectId?: string }) => void
  user: { name: string; username: string; avatarUrl?: string | null }
}

export function ComposerModal({ open, onClose, onPublish, user }: ComposerModalProps) {
  const [content, setContent] = useState('')
  const [projectId, setProjectId] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handlePublish() {
    if (!content.trim()) return
    onPublish({ content: content.trim(), projectId: projectId || undefined })
    toast('Post published.')
    setContent('')
    setProjectId('')
    onClose()
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-0 bg-[rgba(28,43,26,0.32)] z-[var(--z-overlay)]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            className="fixed top-[12vh] left-1/2 -translate-x-1/2 w-full max-w-[560px] bg-[var(--color-surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-overlay)] z-[var(--z-modal)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[0.5px] border-[var(--color-border)]">
              <h2
                className="text-[18px] text-[var(--color-ink)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Create post
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-secondary)] hover:bg-[var(--color-surface)] transition-colors duration-[120ms]"
                aria-label="Close"
              >
                <i className="ti ti-x text-[16px]" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="flex gap-3 px-5 py-4">
              <Avatar src={user.avatarUrl} name={user.name} size="md" />
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextareaChange}
                placeholder="What are you working on?"
                className="flex-1 text-[16px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] bg-transparent border-none outline-none resize-none leading-[var(--leading-body)] min-h-[96px]"
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[0.5px] border-[var(--color-border)]">
              <div className="flex items-center gap-1">
                {[
                  { icon: 'photo', label: 'Add image' },
                  { icon: 'link', label: 'Add link' },
                  { icon: 'code', label: 'Add code' },
                ].map(({ icon, label }) => (
                  <button
                    key={icon}
                    className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent-ink)] transition-colors duration-[120ms]"
                    aria-label={label}
                  >
                    <i className={`ti ti-${icon}`} style={{ fontSize: '16px' }} aria-hidden="true" />
                  </button>
                ))}

                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="ml-1 h-7 px-3 text-[12px] font-[500] text-[var(--color-accent)] bg-[var(--color-accent-subtle)] border border-[0.5px] border-[var(--color-accent)]/30 rounded-[var(--radius-pill)] outline-none cursor-pointer"
                >
                  <option value="">No project</option>
                  {MOCK_PROJECTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                size="sm"
                onClick={handlePublish}
                disabled={!content.trim()}
              >
                Post
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
