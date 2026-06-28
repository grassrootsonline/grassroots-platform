// ============================================================
// badge.tsx — CORRECTED (Amendment 03)
// apps/web/src/components/ui/badge.tsx
// ------------------------------------------------------------
// Before: arbitrary values (bg-[var(--color-accent-subtle)]) AND
//   a parallel .badge-* implementation in components.css that
//   DISAGREED (hardcoded #2E5C2C, different muted bg) and was the
//   wrong tracking (0.04em vs the token's 0.08em, not uppercase).
// After: one implementation, semantic @theme utilities only.
//   Pick ONE source of truth — this TSX — and delete the
//   .badge / .badge-* block from components.css.
// ============================================================

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
        // 0.08em + uppercase = the design-system badge spec (--tracking-label)
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
