import Image from 'next/image'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string | null
  name: string
  size?: AvatarSize
  className?: string
}

const sizeMap: Record<AvatarSize, { px: number; class: string; text: string }> = {
  sm: { px: 28, class: 'w-7 h-7', text: 'text-[11px]' },
  md: { px: 36, class: 'w-9 h-9', text: 'text-[13px]' },
  lg: { px: 48, class: 'w-12 h-12', text: 'text-[16px]' },
  xl: { px: 72, class: 'w-[72px] h-[72px]', text: 'text-[24px]' },
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
  const { px, class: sizeClass, text } = sizeMap[size]
  return (
    <div
      className={[
        'rounded-[var(--radius-pill)] overflow-hidden flex-shrink-0 flex items-center justify-center bg-[var(--color-accent-subtle)] text-[var(--color-accent-ink)] font-[500]',
        sizeClass,
        text,
        className,
      ].join(' ')}
      aria-label={name}
    >
      {src ? (
        <Image src={src} alt={name} width={px} height={px} className="object-cover w-full h-full" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}
