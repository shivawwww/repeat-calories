'use client'

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

const FIELD_BASE =
  'w-full rounded-2xl border-2 border-cream-deep bg-cream-soft px-4 py-3 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition-colors focus:border-green disabled:opacity-50'

interface FieldWrapProps {
  label?: string
  error?: string
  hint?: string
  children: React.ReactNode
  htmlFor?: string
}

export function FieldWrap({ label, error, hint, children, htmlFor }: FieldWrapProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span className="text-xs font-medium text-red">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-soft">{hint}</span>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...rest },
  ref
) {
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id}>
      <input
        ref={ref}
        id={id}
        className={`${FIELD_BASE} ${error ? 'border-red' : ''} ${className}`}
        {...rest}
      />
    </FieldWrap>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className = '', ...rest },
  ref
) {
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id}>
      <textarea ref={ref} id={id} className={`${FIELD_BASE} resize-none ${className}`} {...rest} />
    </FieldWrap>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, className = '', children, ...rest },
  ref
) {
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id}>
      <select ref={ref} id={id} className={`${FIELD_BASE} ${className}`} {...rest}>
        {children}
      </select>
    </FieldWrap>
  )
})
