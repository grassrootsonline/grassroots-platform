type BadgeVariant = 'default' | 'accent' | 'warm' | 'muted' | 'danger'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-surface)] text-[var(--color-ink)] border border-[0.5px] border-[var(--color-border)]',
  accent: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-ink)]',
  warm: 'bg-[var(--color-warm-subtle)] text-[var(--color-warm)]',
  muted: 'bg-[var(--color-border)] text-[var(--color-secondary)]',
  danger: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-[500] tracking-[0.04em]',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
