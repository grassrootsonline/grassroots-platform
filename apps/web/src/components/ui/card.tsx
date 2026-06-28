interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={['card', !padding ? '!p-0' : '', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
