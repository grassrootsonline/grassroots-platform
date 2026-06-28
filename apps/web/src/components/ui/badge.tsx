type BadgeVariant = 'default' | 'accent' | 'warm' | 'muted' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface text-ink border-[0.5px] border-border',
  accent:  'bg-accent-subtle text-accent-ink',
  warm:    'bg-warm-subtle text-warm',
  muted:   'bg-surface text-secondary border-[0.5px] border-border',
  danger:  'bg-danger-subtle text-danger',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-xs px-2 py-0.5 rounded-pill',
        'text-label font-medium uppercase tracking-label whitespace-nowrap',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
