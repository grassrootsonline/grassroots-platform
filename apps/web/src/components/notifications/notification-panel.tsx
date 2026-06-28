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

export function NotificationPanel({ onClose: _ }: NotificationPanelProps) {
  return (
    <div
      className="absolute top-full right-0 mt-2 w-[340px] bg-surface border-[0.5px] border-border rounded-lg shadow-overlay z-[var(--z-modal)] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[0.5px] border-border">
        <span className="text-body font-medium text-ink">Notifications</span>
        <button className="btn btn-ghost btn-sm">Mark all read</button>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {MOCK_NOTIFICATIONS.map((n) => (
          <div key={n.id} className="notif cursor-pointer">
            <div className={['notif-dot', n.read ? 'read' : ''].filter(Boolean).join(' ')} />
            <Avatar src={n.actor.avatarUrl} name={n.actor.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="notif-text">
                <span className="font-medium text-ink">{n.actor.name}</span>{' '}
                {n.text}
              </p>
              <p className="notif-time">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
