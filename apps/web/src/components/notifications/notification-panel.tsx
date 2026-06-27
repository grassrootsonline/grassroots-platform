'use client'

import { Avatar } from '@/components/ui/avatar'

interface Notification {
  id: string
  actor: { name: string; username: string; avatarUrl?: string | null }
  text: string
  time: string
  read: boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    actor: { name: 'Sarah Chen', username: 'sarahchen' },
    text: 'liked your post about the inference stack.',
    time: '2m',
    read: false,
  },
  {
    id: '2',
    actor: { name: 'Marcus Rivera', username: 'mrivera' },
    text: 'started following you.',
    time: '14m',
    read: false,
  },
  {
    id: '3',
    actor: { name: 'Priya Nair', username: 'priyanair' },
    text: 'replied to your post.',
    time: '1h',
    read: true,
  },
  {
    id: '4',
    actor: { name: 'Leo Tanaka', username: 'leotanaka' },
    text: 'is now following your project.',
    time: '3h',
    read: true,
  },
]

interface NotificationPanelProps {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  return (
    <div
      className="absolute top-full right-0 mt-2 w-[340px] bg-[var(--color-surface)] border border-[0.5px] border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-overlay)] z-[var(--z-modal)] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[0.5px] border-[var(--color-border)]">
        <span className="text-[14px] font-[500] text-[var(--color-ink)]">Notifications</span>
        <button className="text-[13px] text-[var(--color-accent)] hover:underline">
          Mark all read
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {MOCK_NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            className={[
              'flex items-start gap-3 px-4 py-3 transition-colors duration-100 hover:bg-[var(--color-canvas)] cursor-pointer',
              !n.read ? 'bg-[var(--color-accent-subtle)]/20' : '',
            ].join(' ')}
          >
            <Avatar src={n.actor.avatarUrl} name={n.actor.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[var(--color-ink-soft)] leading-[1.45]">
                <span className="font-[500] text-[var(--color-ink)]">{n.actor.name}</span>{' '}
                {n.text}
              </p>
              <span className="text-[12px] text-[var(--color-secondary)]">{n.time}</span>
            </div>
            {!n.read && (
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] flex-shrink-0 mt-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
