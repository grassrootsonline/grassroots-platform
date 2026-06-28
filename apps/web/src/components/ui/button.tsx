'use client'

import { forwardRef } from 'react'
import s from './button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  iconOnly?: boolean
  loading?: boolean
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
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
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'btn',
        variantClass[variant],
        sizeClass[size],
        iconOnly ? 'btn-icon' : '',
        s.root,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <i className="ti ti-loader-2 animate-spin icon-base" aria-hidden="true" />
      ) : icon ? (
        <i className={`ti ti-${icon} icon-base`} aria-hidden="true" />
      ) : null}
      {!iconOnly && children}
    </button>
  )
})
