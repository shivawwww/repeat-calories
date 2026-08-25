'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import StatCard from '@/components/admin/StatCard'
import ItemSalesChart from '@/components/admin/ItemSalesChart'
import Skeleton from '@/components/ui/Skeleton'

interface ItemSale {
  name: string
  total_qty: number
}

interface Summary {
  total_revenue: number
  orders_today: number
  pending_count: number
}

export default function AdminAnalyticsPage() {
  const [items, setItems] = useState<ItemSale[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get<ItemSale[]>('/api/admin/analytics/itemsales'), api.get<Summary>('/api/admin/analytics/summary')])
      .then(([i, s]) => {
        setItems(i.obj)
        setSummary(s.obj)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Analytics</h1>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Revenue" value={`₹${summary?.total_revenue ?? 0}`} icon="💰" tone="green" />
          <StatCard label="Orders Today" value={String(summary?.orders_today ?? 0)} icon="📦" tone="orange" />
          <StatCard label="Menu Items Sold" value={String(items.reduce((s, i) => s + i.total_qty, 0))} icon="🍽️" tone="gold" />
        </div>
      )}

      <div className="mt-8 rounded-3xl border border-cream-deep bg-cream-soft p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Item Sales</h2>
        <p className="mt-1 text-xs text-ink-soft">Ranked by total quantity across confirmed, preparing, ready and delivered orders.</p>
        <div className="mt-6">
          {loading ? <Skeleton className="h-64" /> : <ItemSalesChart data={items} />}
        </div>
      </div>
    </div>
  )
}
