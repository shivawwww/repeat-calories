'use client'

import { useState } from 'react'
import OrderStatusBadge from '@/components/order/OrderStatusBadge'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
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

export default function OrderRow({
  order,
  onStatusChange,
}: {
  order: Order
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>
}) {
  const { show } = useToast()
  const [updating, setUpdating] = useState(false)
  const [paid, setPaid] = useState(order.payment_status === 'paid')
  const [payBusy, setPayBusy] = useState(false)
  const next = NEXT_STATUS[order.status]
  const isManual = order.source === 'manual'

  async function handleAdvance() {
    if (!next) return
    setUpdating(true)
    try {
      await onStatusChange(order.id, next)
    } finally {
      setUpdating(false)
    }
  }

  async function togglePaid() {
    setPayBusy(true)
    try {
      await api.patch(`/api/admin/orders/${order.id}/payment`, { paid: !paid })
      setPaid(!paid)
      show('Payment updated', 'success')
    } catch {
      show('Could not update payment', 'error')
    } finally {
      setPayBusy(false)
    }
  }

  return (
    <div className="rounded-3xl border border-cream-deep bg-cream-soft p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-sm font-bold text-ink">{order.order_number}</p>
            <OrderStatusBadge status={order.status} />
            {isManual && <Badge tone="neutral">{order.order_kind === 'subscription' ? 'subscription' : 'manual'}</Badge>}
            {order.meal_type && (
              <Badge tone="orange">
                {order.meal_type}
                {order.meal_variant && order.meal_variant !== 'rice_bowl' ? ` · ${order.meal_variant.replace('_', ' ')}` : ''}
              </Badge>
            )}
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

      {order.items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
          {order.items.map((i, idx) => (
            <span key={i.menu_item_id || idx}>
              {i.name} ×{i.quantity}
            </span>
          ))}
        </div>
      )}

      {(order.delivery_address.full_address || order.delivery_address.area) && (
        <p className="mt-2 text-xs text-ink-soft">
          📍 {order.delivery_address.full_address}, {order.delivery_address.area}, {order.delivery_address.city} -{' '}
          {order.delivery_address.pincode}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="stat-figure font-display text-lg font-bold text-ink">₹{order.total_amount}</span>
          {isManual ? (
            <button
              type="button"
              onClick={togglePaid}
              disabled={payBusy}
              className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide disabled:opacity-50 ${
                paid ? 'bg-green-soft text-green-dark' : 'bg-gold/15 text-gold'
              }`}
            >
              {paid ? 'Paid' : 'Mark paid'}
            </button>
          ) : (
            <Badge tone={paid ? 'green' : 'gold'}>{paid ? 'paid' : order.payment_status}</Badge>
          )}
        </div>
        {next && (
          <Button size="sm" loading={updating} onClick={handleAdvance}>
            {NEXT_LABEL[order.status]}
          </Button>
        )}
      </div>
    </div>
  )
}
