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
