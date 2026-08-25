'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, withIds } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import OrderRow from '@/components/admin/OrderRow'
import Skeleton from '@/components/ui/Skeleton'
import { Order, OrderStatus } from '@/types/models'

const TABS: { key: string; label: string; status: OrderStatus | null }[] = [
  { key: 'received', label: 'Received', status: 'confirmed' },
  { key: 'preparing', label: 'Preparing', status: 'preparing' },
  { key: 'ready', label: 'Ready', status: 'ready' },
  { key: 'delivered', label: 'Delivered', status: 'delivered' },
  { key: 'failed', label: 'Failed', status: 'payment_failed' },
  { key: 'all', label: 'All Orders', status: null },
]

const REFRESH_MS = 30000

export default function AdminOrdersPage() {
  const [tab, setTab] = useState(TABS[0])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { show } = useToast()

  const fetchOrders = useCallback(async (status: OrderStatus | null, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const path = status ? `/api/admin/orders/bystatus?status=${status}` : '/api/admin/orders/getall'
      const { obj } = await api.get<(Order & { _id: string })[]>(path)
      setOrders(withIds(obj))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Loads orders for the active tab on mount / tab change — not derived from render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders(tab.status)
    const interval = setInterval(() => fetchOrders(tab.status, true), REFRESH_MS)
    return () => clearInterval(interval)
  }, [tab, fetchOrders])

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    try {
      await api.patch('/api/admin/orders/updatestatus', { order_id: orderId, status })
      show('Order status updated', 'success')
      fetchOrders(tab.status, true)
    } catch {
      show('Could not update status', 'error')
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Orders</h1>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab.key === t.key ? 'bg-green text-cream-soft' : 'bg-cream-deep/50 text-ink-soft hover:bg-cream-deep'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-soft">No orders in this view.</p>
        ) : (
          orders.map((o) => <OrderRow key={o.id} order={o} onStatusChange={handleStatusChange} />)
        )}
      </div>
    </div>
  )
}
