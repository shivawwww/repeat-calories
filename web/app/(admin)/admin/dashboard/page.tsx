'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, withIds } from '@/lib/api'
import StatCard from '@/components/admin/StatCard'
import OrderStatusBadge from '@/components/order/OrderStatusBadge'
import Skeleton from '@/components/ui/Skeleton'
import { formatIST } from '@/lib/datetime'
import { Order } from '@/types/models'

interface Summary {
  total_revenue: number
  orders_today: number
  pending_count: number
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [recent, setRecent] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Summary>('/api/admin/analytics/summary'),
      api.get<(Order & { _id: string })[]>('/api/admin/orders/getall'),
    ])
      .then(([s, o]) => {
        setSummary(s.obj)
        setRecent(withIds(o.obj).slice(0, 6))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Dashboard</h1>

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
          <StatCard label="Pending Payment" value={String(summary?.pending_count ?? 0)} icon="⏳" tone="gold" />
        </div>
      )}

      <div className="mt-8 rounded-3xl border border-cream-deep bg-cream-soft p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold uppercase tracking-wide text-green hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 flex flex-col divide-y divide-cream-deep">
          {loading ? (
            <Skeleton className="h-10" />
          ) : recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-soft">No orders yet.</p>
          ) : (
            recent.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders?highlight=${o.order_number}`}
                className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:text-green"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{o.order_number}</p>
                  <p className="truncate text-xs text-ink-soft">{o.user_snapshot.name} · {formatIST(o.created_at, 'DD MMM, hh:mm A')}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="stat-figure font-semibold text-ink">₹{o.total_amount}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
