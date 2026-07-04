'use client'

import { Avatar } from '@/components/ui/avatar'
import type { AppNotification } from '@/lib/data'
import s from './notification-panel.module.css'

interface NotificationPanelProps {
  onClose: () => void
  notifications: AppNotification[]
}

export function NotificationPanel({ onClose: _, notifications }: NotificationPanelProps) {
  return (
    <div className={s.panel} onClick={(e) => e.stopPropagation()}>
      <div className={s.header}>
        <span className="text-body" style={{ fontWeight: 'var(--weight-medium)', color: 'var(--color-ink)' }}>Notifications</span>
        <button className="btn btn-ghost btn-sm">Mark all read</button>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-lg) var(--space-md)' }}>
          <p className="empty-state-body" style={{ margin: 0 }}>No notifications yet.</p>
        </div>
      ) : (
        <div className={s.list}>
          {notifications.map((n) => (
            <div key={n.id} className="notif" style={{ cursor: 'pointer' }}>
              <div className={['notif-dot', n.read ? 'read' : ''].filter(Boolean).join(' ')} />
              <Avatar src={n.actor.avatarUrl} name={n.actor.name} size="sm" />
              <div className={s.textWrap}>
                <p className="notif-text">
                  <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--color-ink)' }}>{n.actor.name}</span>{' '}
                  {n.text}
                </p>
                <p className="notif-time">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
