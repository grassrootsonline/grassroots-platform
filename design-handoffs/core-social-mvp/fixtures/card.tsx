// ============================================================
// card.tsx — CORRECTED (Amendment 03)
// apps/web/src/components/ui/card.tsx
// ------------------------------------------------------------
// Before: bg-[var(--color-surface)] border-[0.5px]
//   border-[var(--color-border)] rounded-[var(--radius-lg)]
//   p-[18px]  — every token smuggled through arbitrary syntax,
//   and a parallel .card class in components.css.
// After: semantic @theme utilities. Cards have NO shadow
//   (hairline border only) — a design-system signature.
// ============================================================

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={[
        'bg-surface border-[0.5px] border-border rounded-lg',
        padding ? 'px-lg py-lg' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
