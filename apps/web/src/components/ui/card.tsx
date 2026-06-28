import s from './card.module.css'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={[s.card, padding ? s.padded : '', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
