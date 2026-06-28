import Image from 'next/image'
import s from './avatar.module.css'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string | null
  name: string
  size?: AvatarSize
  className?: string
}

const sizePx: Record<AvatarSize, number> = {
  sm: 24,
  md: 36,
  lg: 48,
  xl: 72,
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const px = sizePx[size]
  return (
    <div
      className={['avatar', `avatar-${size}`, className].filter(Boolean).join(' ')}
      aria-label={name}
    >
      {src ? (
        <Image src={src} alt={name} width={px} height={px} className={s.img} />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}
