import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  autoGrow?: boolean
}

const inputBase =
  'w-full bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] border border-[0.5px] border-[var(--color-border-strong)] rounded-[var(--radius-md)] px-3 py-2 text-[14px] outline-none transition-all duration-[120ms] focus:border-[var(--color-accent)] focus:shadow-[var(--focus-ring)]'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[13px] font-[500] text-[var(--color-ink)]">{label}</label>
      )}
      <input
        ref={ref}
        className={[
          inputBase,
          error ? 'border-[var(--color-danger)] focus:shadow-[0_0_0_3px_rgba(193,122,90,0.15)]' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-[12px] text-[var(--color-danger)]">{error}</p>}
      {hint && !error && <p className="text-[12px] text-[var(--color-secondary)]">{hint}</p>}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, autoGrow, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[13px] font-[500] text-[var(--color-ink)]">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={4}
        className={[
          inputBase,
          'resize-none leading-[var(--leading-body)]',
          error ? 'border-[var(--color-danger)] focus:shadow-[0_0_0_3px_rgba(193,122,90,0.15)]' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-[12px] text-[var(--color-danger)]">{error}</p>}
      {hint && !error && <p className="text-[12px] text-[var(--color-secondary)]">{hint}</p>}
    </div>
  )
})
