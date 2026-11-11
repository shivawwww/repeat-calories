'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, withIds } from '@/lib/api'
import OrderRow from '@/components/admin/OrderRow'
import Skeleton from '@/components/ui/Skeleton'
import { Order } from '@/types/models'

const FILTERS: { key: string; label: string; payment: 'paid' | 'unpaid' | null }[] = [
  { key: 'all', label: 'All Orders', payment: null },
  { key: 'unpaid', label: 'Unpaid', payment: 'unpaid' },
  { key: 'paid', label: 'Paid', payment: 'paid' },
]

const REFRESH_MS = 30000

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState(FILTERS[0])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async (payment: 'paid' | 'unpaid' | null, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const path = payment ? `/api/admin/orders/getall?payment=${payment}` : '/api/admin/orders/getall'
      const { obj } = await api.get<(Order & { _id: string })[]>(path)
      setOrders(withIds(obj))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Loads orders for the active filter on mount / change — not derived from render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders(filter.payment)
    const interval = setInterval(() => fetchOrders(filter.payment, true), REFRESH_MS)
    return () => clearInterval(interval)
  }, [filter, fetchOrders])

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Orders</h1>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter.key === f.key ? 'bg-green text-cream-soft' : 'bg-cream-deep/50 text-ink-soft hover:bg-cream-deep'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-soft">No orders in this view.</p>
        ) : (
          orders.map((o) => <OrderRow key={o.id} order={o} />)
        )}
      </div>
    </div>
  )
}
