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

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className = '', ...props },
  ref
) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <input
        ref={ref}
        className={['input', error ? 'input-error' : '', className].filter(Boolean).join(' ')}
        {...props}
      />
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="field-hint">{hint}</p>}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, autoGrow, className = '', ...props },
  ref
) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <textarea
        ref={ref}
        rows={4}
        className={['input', error ? 'input-error' : '', className].filter(Boolean).join(' ')}
        {...props}
      />
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="field-hint">{hint}</p>}
    </div>
  )
})
