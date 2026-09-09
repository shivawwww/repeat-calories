'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api, withIds } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import StatCard from '@/components/admin/StatCard'
import DailyOrdersPanel from '@/components/admin/DailyOrdersPanel'
import ExpensesPanel from '@/components/admin/ExpensesPanel'
import OrderStatusBadge from '@/components/order/OrderStatusBadge'
import Skeleton from '@/components/ui/Skeleton'
import { formatIST } from '@/lib/datetime'
import { Order } from '@/types/models'

interface Summary {
  total_revenue: number
  today_received: number
  total_unpaid: number
  total_expenses: number
  net: number
  total_orders: number
}

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function AdminDashboardPage() {
  const { show } = useToast()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [recent, setRecent] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [wiping, setWiping] = useState(false)

  const loadSummary = useCallback(async () => {
    const s = await api.get<Summary>('/api/admin/analytics/summary')
    setSummary(s.obj)
  }, [])

  async function resetAll() {
    if (prompt('This deletes ALL orders, subscriptions, expenses and customers. Type DELETE to confirm.') !== 'DELETE') return
    setWiping(true)
    try {
      const { obj } = await api.post<Record<string, number>>('/api/admin/reset', { confirm: 'DELETE EVERYTHING' })
      show(
        `Wiped: ${obj.orders} orders, ${obj.subscriptions} subs, ${obj.expenses} expenses, ${obj.walkin_customers} customers`,
        'success'
      )
      window.location.reload()
    } catch {
      show('Reset failed', 'error')
    } finally {
      setWiping(false)
    }
  }

  useEffect(() => {
    Promise.all([
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
      loadSummary(),
      api.get<(Order & { _id: string })[]>('/api/admin/orders/getall').then((o) => setRecent(withIds(o.obj).slice(0, 6))),
    ]).finally(() => setLoading(false))
  }, [loadSummary])

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Dashboard</h1>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Revenue" value={money(summary?.total_revenue ?? 0)} icon="💰" tone="green" />
          <StatCard label="Received Today" value={money(summary?.today_received ?? 0)} icon="✅" tone="green" />
          <StatCard label="Total Unpaid" value={money(summary?.total_unpaid ?? 0)} icon="⏳" tone="gold" />
          <StatCard label="Total Expenses" value={money(summary?.total_expenses ?? 0)} icon="🧾" tone="orange" />
          <StatCard label="Net" value={money(summary?.net ?? 0)} icon="📈" tone={(summary?.net ?? 0) >= 0 ? 'green' : 'orange'} />
          <StatCard label="Total Orders" value={String(summary?.total_orders ?? 0)} icon="📦" tone="orange" />
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <DailyOrdersPanel onMutate={loadSummary} />
        <ExpensesPanel onMutate={loadSummary} />
      </div>

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
                  <p className="truncate text-xs text-ink-soft">
                    {o.user_snapshot.name} · {formatIST(o.created_at, 'DD MMM, hh:mm A')}
                  </p>
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

      <div className="mt-8 rounded-3xl border border-red/30 bg-red-soft/40 p-5">
        <p className="text-sm font-semibold text-red">Danger zone</p>
        <p className="mt-1 text-xs text-ink-soft">
          Permanently deletes every order, subscription, expense and walk-in customer. Your login and the menu are kept.
        </p>
        <Button variant="danger" size="sm" className="mt-3" loading={wiping} onClick={resetAll}>
          Reset all data
        </Button>
      </div>
    </div>
  )
}
