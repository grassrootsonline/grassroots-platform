'use client'

import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'dev-theme'

const ICONS: Record<Theme, string> = {
  system: 'ti-circle-half-2',
  light:  'ti-sun',
  dark:   'ti-moon',
}

const LABELS: Record<Theme, string> = {
  system: 'Theme: system',
  light:  'Theme: light',
  dark:   'Theme: dark',
}

const CYCLE: Record<Theme, Theme> = {
  system: 'light',
  light:  'dark',
  dark:   'system',
}

function applyTheme(t: Theme) {
  if (t === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', t)
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && stored in CYCLE) {
      setTheme(stored)
      applyTheme(stored)
    }
  }, [])

  function handleClick() {
    const next = CYCLE[theme]
    setTheme(next)
    applyTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <button
      onClick={handleClick}
      className="btn btn-ghost btn-icon"
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
    >
      <i className={`ti ${ICONS[theme]} icon-md`} aria-hidden="true" />
    </button>
  )
}
