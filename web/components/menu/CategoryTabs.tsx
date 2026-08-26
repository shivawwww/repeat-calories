'use client'

export default function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: string[]
  active: string
  onChange: (category: string) => void
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }}>
      {categories.map((c) => {
        const isActive = c === active
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`shrink-0 rounded-full px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wide transition-all active:scale-95 ${
              isActive ? 'bg-green text-cream-soft shadow-sm shadow-green/30' : 'bg-cream-deep/50 text-ink-soft hover:bg-cream-deep'
            }`}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}
