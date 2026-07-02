import s from './leaf-background.module.css'

const LEAF_PATH = 'M0,-10 C4,-10 7,-6 7,-2 C7,2 3,4 0,4 C-3,4 -7,2 -7,-2 C-7,-6 -4,-10 0,-10 Z'

const LEAVES: Array<{
  drift: 'a' | 'b' | 'c' | 'd'
  size: number
  left: string
  top: string
  opacity: number
  duration: string
  delay: string
  color: 1 | 2
}> = [
  { drift: 'c', size: 22, left: '8%', top: '78%', opacity: 0.20, duration: '8s', delay: '-2s', color: 1 },
  { drift: 'a', size: 20, left: '22%', top: '82%', opacity: 0.18, duration: '9s', delay: '-5.1s', color: 1 },
  { drift: 'b', size: 24, left: '38%', top: '75%', opacity: 0.22, duration: '7s', delay: '-1.5s', color: 2 },
  { drift: 'd', size: 18, left: '54%', top: '80%', opacity: 0.19, duration: '9s', delay: '-6.3s', color: 1 },
  { drift: 'a', size: 22, left: '70%', top: '77%', opacity: 0.21, duration: '8s', delay: '-3.8s', color: 2 },
  { drift: 'c', size: 20, left: '85%', top: '83%', opacity: 0.18, duration: '9s', delay: '-0.8s', color: 1 },
  { drift: 'b', size: 14, left: '5%', top: '55%', opacity: 0.14, duration: '12s', delay: '-4.4s', color: 1 },
  { drift: 'a', size: 16, left: '28%', top: '60%', opacity: 0.13, duration: '11s', delay: '-8.1s', color: 2 },
  { drift: 'd', size: 13, left: '46%', top: '52%', opacity: 0.12, duration: '13s', delay: '-1.8s', color: 1 },
  { drift: 'c', size: 15, left: '63%', top: '58%', opacity: 0.14, duration: '12s', delay: '-6.5s', color: 1 },
  { drift: 'b', size: 14, left: '80%', top: '62%', opacity: 0.13, duration: '11s', delay: '-9.2s', color: 2 },
  { drift: 'a', size: 9, left: '12%', top: '35%', opacity: 0.09, duration: '16s', delay: '-3.7s', color: 1 },
  { drift: 'd', size: 8, left: '33%', top: '28%', opacity: 0.08, duration: '17s', delay: '-9.3s', color: 2 },
  { drift: 'c', size: 10, left: '52%', top: '32%', opacity: 0.09, duration: '15s', delay: '-5.9s', color: 1 },
  { drift: 'b', size: 9, left: '74%', top: '40%', opacity: 0.08, duration: '16s', delay: '-2.6s', color: 1 },
  { drift: 'a', size: 8, left: '91%', top: '38%', opacity: 0.09, duration: '15s', delay: '-12s', color: 2 },
  { drift: 'd', size: 11, left: '18%', top: '90%', opacity: 0.16, duration: '10s', delay: '-7.5s', color: 1 },
  { drift: 'c', size: 19, left: '93%', top: '70%', opacity: 0.20, duration: '8s', delay: '-4.2s', color: 2 },
  { drift: 'b', size: 12, left: '44%', top: '18%', opacity: 0.11, duration: '13s', delay: '-10s', color: 1 },
]

export function LeafBackground() {
  return (
    <div className={s.wrap} aria-hidden="true">
      {LEAVES.map((leaf, i) => (
        <svg
          key={i}
          className={s[`drift${leaf.drift.toUpperCase()}`]}
          width={leaf.size}
          height={leaf.size}
          viewBox="-8 -12 16 16"
          style={{
            position: 'absolute',
            left: leaf.left,
            top: leaf.top,
            opacity: leaf.opacity,
            ['--ld' as string]: leaf.duration,
            ['--dd' as string]: leaf.delay,
          }}
        >
          <path d={LEAF_PATH} fill={leaf.color === 1 ? 'var(--color-decoration-leaf-1)' : 'var(--color-decoration-leaf-2)'} />
        </svg>
      ))}
    </div>
  )
}
