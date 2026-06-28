import s from './badge.module.css'

type BadgeVariant = 'default' | 'accent' | 'warm' | 'muted' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={[s.badge, s[variant], className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
