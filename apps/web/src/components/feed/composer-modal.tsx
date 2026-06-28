'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import s from './composer-modal.module.css'

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
            className={s.scrim}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            className={s.panel}
          >
            {/* Header */}
            <div className={s.header}>
              <h2 className={s.heading}>Create post</h2>
              <button
                onClick={onClose}
                className={s.closeBtn}
                aria-label="Close"
              >
                <i className="ti ti-x icon-base" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className={s.body}>
              <Avatar src={user.avatarUrl} name={user.name} size="md" />
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextareaChange}
                placeholder="What are you working on?"
                className={s.textarea}
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className={s.footer}>
              <div className={s.tools}>
                {[
                  { icon: 'photo', label: 'Add image' },
                  { icon: 'link', label: 'Add link' },
                  { icon: 'code', label: 'Add code' },
                ].map(({ icon, label }) => (
                  <button
                    key={icon}
                    className={s.toolBtn}
                    aria-label={label}
                  >
                    <i className={`ti ti-${icon} icon-base`} aria-hidden="true" />
                  </button>
                ))}

                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className={s.projectSelect}
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
