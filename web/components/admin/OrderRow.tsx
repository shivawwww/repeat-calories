'use client'

import { useState } from 'react'
import OrderStatusBadge from '@/components/order/OrderStatusBadge'
import Button from '@/components/ui/Button'
import { formatIST } from '@/lib/datetime'
import { Order, OrderStatus } from '@/types/models'

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Mark Delivered',
}

function elapsed(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const mins = Math.max(0, Math.floor(diffMs / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function OrderRow({ order, onStatusChange }: { order: Order; onStatusChange: (id: string, status: OrderStatus) => Promise<void> }) {
  const [updating, setUpdating] = useState(false)
  const next = NEXT_STATUS[order.status]

  async function handleAdvance() {
    if (!next) return
    setUpdating(true)
    try {
      await onStatusChange(order.id, next)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="rounded-3xl border border-cream-deep bg-cream-soft p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-sm font-bold text-ink">{order.order_number}</p>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            {formatIST(order.created_at, 'DD MMM, hh:mm A')} · {elapsed(order.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-ink">{order.user_snapshot.name}</p>
          <p className="text-xs text-ink-soft">{order.user_snapshot.mobile}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
        {order.items.map((i) => (
          <span key={i.menu_item_id}>
            {i.name} ×{i.quantity}
          </span>
        ))}
      </div>

      <p className="mt-2 text-xs text-ink-soft">
        📍 {order.delivery_address.full_address}, {order.delivery_address.area}, {order.delivery_address.city} - {order.delivery_address.pincode}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className="stat-figure font-display text-lg font-bold text-ink">₹{order.total_amount}</span>
        {next && (
          <Button size="sm" loading={updating} onClick={handleAdvance}>
            {NEXT_LABEL[order.status]}
          </Button>
        )}
      </div>
    </div>
  )
}
