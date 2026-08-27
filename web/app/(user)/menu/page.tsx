'use client'

import { useEffect, useMemo, useState } from 'react'
import { api, withIds } from '@/lib/api'
import MenuCard from '@/components/menu/MenuCard'
import CategoryTabs from '@/components/menu/CategoryTabs'
import Skeleton from '@/components/ui/Skeleton'
import { IconSearch } from '@/components/ui/icons'
import { isCategoryOrderable } from '@/lib/orderCutoff'
import { MenuItem } from '@/types/models'

const CATEGORY_ORDER = ['Lunch', 'Dinner', 'Breakfast', 'Snacks', 'Beverages']
const CUTOFF_NOTE: Record<string, string> = {
  Lunch: 'Lunch orders close at 10:00 AM IST for same-day delivery.',
  Dinner: 'Dinner orders close at 4:00 PM IST for same-day delivery.',
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('')

  useEffect(() => {
    api
      .get<(MenuItem & { _id: string })[]>('/api/menu/getall')
      .then(({ obj }) => {
        const normalized = withIds(obj)
        setItems(normalized)
        const cats = Array.from(new Set(normalized.flatMap((i) => i.meal_times)))
        cats.sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
        if (cats.length) setCategory(cats[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.flatMap((i) => i.meal_times)))
    cats.sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
    return cats
  }, [items])

  const orderable = isCategoryOrderable(category)

  // A featured item can be tagged for more than one meal time — show it as
  // orderable as long as at least one of those meal times is currently open.
  const featured = useMemo(
    () => items.filter((i) => i.is_featured).map((i) => ({ ...i, orderable: i.meal_times.some(isCategoryOrderable) })),
    [items]
  )

  const visible = useMemo(() => {
    const byCategory = items.filter((i) => i.meal_times.includes(category)).map((i) => ({ ...i, orderable }))
    if (!query.trim()) return byCategory
    const q = query.trim().toLowerCase()
    return byCategory.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
  }, [items, category, query, orderable])

  return (
    <div className="pb-6">
      <div className="animate-rise">
        <h1 className="font-display text-3xl font-semibold text-ink">What are we repeating today?</h1>
        <p className="mt-1 text-sm text-ink-soft">Macro-balanced meals, cooked fresh across Coimbatore.</p>
      </div>

      <div className="relative mt-5">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search meals…"
          className="w-full rounded-full border-2 border-cream-deep bg-cream-soft py-3 pl-11 pr-4 text-sm text-ink outline-none transition-colors focus:border-green"
        />
      </div>

      {!loading && featured.length > 0 && !query && (
        <div className="mt-7">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-orange">🔥 Featured</h2>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {featured.map((item) => (
              <div key={item.id} className="w-56 shrink-0">
                <MenuCard item={item} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7">
        <CategoryTabs categories={categories} active={category} onChange={setCategory} />
        {CUTOFF_NOTE[category] && (
          <p className="mt-3 text-xs font-medium text-ink-soft">
            {orderable ? '🕓 ' : '⏰ '}
            {CUTOFF_NOTE[category]}
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)
          : visible.map((item, idx) => (
              <div key={item.id} className="animate-rise" style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}>
                <MenuCard item={item} />
              </div>
            ))}
      </div>

      {!loading && visible.length === 0 && (
        <div className="mt-16 text-center text-sm text-ink-soft">No meals match your search in this category.</div>
      )}
    </div>
  )
}
