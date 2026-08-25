import { HTMLAttributes } from 'react'

export default function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-cream-deep bg-cream-soft shadow-sm shadow-ink/5 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
