type BadgeVariant = 'default' | 'accent' | 'warm' | 'muted' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClass: Record<BadgeVariant, string> = {
  default: 'badge-default',
  accent: 'badge-accent',
  warm: 'badge-warm',
  muted: 'badge-muted',
  danger: 'badge-danger',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={['badge', variantClass[variant], className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
