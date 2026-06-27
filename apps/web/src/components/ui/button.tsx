'use client'

import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  iconOnly?: boolean
  loading?: boolean
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-7 px-3 text-[13px]',
  md: 'h-9 px-4 text-[14px]',
  lg: 'h-11 px-6 text-[15px]',
}

const iconOnlySizes: Record<ButtonSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-ink)] text-[var(--color-canvas)] hover:opacity-[0.88] active:opacity-[0.76]',
  secondary:
    'bg-transparent text-[var(--color-ink)] border border-[0.5px] border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] active:opacity-70',
  ghost:
    'bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-accent-subtle)] active:opacity-70',
  danger:
    'bg-[var(--color-danger)] text-white hover:opacity-[0.88] active:opacity-[0.76]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconOnly = false,
    loading,
    children,
    className = '',
    disabled,
    ...props
  },
  ref
) {
  const sizeClass = iconOnly ? iconOnlySizes[size] : sizeStyles[size]
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-1.5 font-[500] rounded-[var(--radius-md)] transition-all duration-[120ms] cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClass,
        variantStyles[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <i className="ti ti-loader-2 animate-spin text-[16px]" aria-hidden="true" />
      ) : icon ? (
        <i className={`ti ti-${icon} text-[16px]`} aria-hidden="true" />
      ) : null}
      {!iconOnly && children}
    </button>
  )
})
