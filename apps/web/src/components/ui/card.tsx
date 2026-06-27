interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div
      className={[
        'bg-[var(--color-surface)] border border-[0.5px] border-[var(--color-border)] rounded-[var(--radius-lg)]',
        padding ? 'p-[18px]' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
