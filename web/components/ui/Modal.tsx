'use client'

import { useEffect } from 'react'

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-rise relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream-soft p-6 shadow-2xl sm:rounded-3xl sm:p-8">
        {title && (
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-cream-deep"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
