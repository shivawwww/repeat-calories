'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  full?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-orange text-cream-soft hover:bg-orange-dark shadow-sm shadow-orange/30 disabled:hover:bg-orange',
  secondary:
    'bg-green text-cream-soft hover:bg-green-dark shadow-sm shadow-green/30 disabled:hover:bg-green',
  outline:
    'bg-transparent text-green border-2 border-green hover:bg-green-soft disabled:hover:bg-transparent',
  ghost: 'bg-transparent text-ink hover:bg-cream-deep/60 disabled:hover:bg-transparent',
  danger: 'bg-red text-cream-soft hover:bg-red/90 disabled:hover:bg-red',
}

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-4 py-2 gap-1.5',
  md: 'text-sm px-6 py-3 gap-2',
  lg: 'text-base px-8 py-3.5 gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, full = false, disabled, className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-full font-display font-semibold uppercase tracking-wide transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
})

export default Button
