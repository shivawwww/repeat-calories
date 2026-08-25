'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { api, withIds } from '@/lib/api'
import { useCart } from '@/hooks/useCart'
import { useRouter } from 'next/navigation'
import { Order } from '@/types/models'
import { formatIST } from '@/lib/datetime'
import OrderStatusBadge from '@/components/order/OrderStatusBadge'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'

export default function OrderDetailPage({ params }: { params: Promise<{ order_number: string }> }) {
  const { order_number } = use(params)
  const router = useRouter()
  const { addItem } = useCart()
  const [order, setOrder] = useState<Order | null | undefined>(undefined)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    api
      .get<(Order & { _id: string })[]>('/api/orders/mine')
      .then(({ obj }) => {
        const found = withIds(obj).find((o) => o.order_number === order_number)
        setOrder(found ?? null)
      })
      .catch(() => setOrder(null))
  }, [order_number])

  async function handleReorder() {
    if (!order) return
    setReordering(true)
    for (const item of order.items) {
      await addItem(item.menu_item_id, item.quantity)
    }
    setReordering(false)
    router.push('/cart')
  }

  if (order === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (order === null) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Order not found</h1>
        <Link href="/orders" className="mt-4 font-semibold text-green hover:underline">
          Back to orders
        </Link>
      </div>
    )
  }

  return (
    <div className="pb-6">
      <Link href="/orders" className="text-xs font-bold uppercase tracking-wide text-ink-soft hover:text-green">
        ← Back to Orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{order.order_number}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">{formatIST(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-cream-deep bg-cream-soft p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">Items</h2>
            <div className="mt-3 flex flex-col divide-y divide-cream-deep">
              {order.items.map((item) => (
                <div key={item.menu_item_id} className="flex justify-between py-2.5 text-sm">
                  <span className="text-ink">
                    {item.name} <span className="text-ink-soft">×{item.quantity}</span>
                  </span>
                  <span className="stat-figure font-semibold text-ink">₹{item.subtotal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cream-deep bg-cream-soft p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-soft">Delivery Address</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">{order.delivery_address.label}</span> —{' '}
              {order.delivery_address.full_address}, {order.delivery_address.area}, {order.delivery_address.city} -{' '}
              {order.delivery_address.pincode}
            </p>
            {order.notes && <p className="mt-2 text-sm text-ink-soft">Note: {order.notes}</p>}
          </div>
        </div>

        <div className="h-fit rounded-3xl border border-cream-deep bg-cream-soft p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Payment</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Method</span>
              <span className="font-semibold text-ink">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Status</span>
              <span className="font-semibold capitalize text-ink">{order.payment_status}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span className="stat-figure font-semibold text-ink">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Delivery</span>
              <span className="stat-figure font-semibold text-ink">{order.delivery_charge === 0 ? 'FREE' : `₹${order.delivery_charge}`}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-cream-deep pt-3 font-display text-base font-bold text-ink">
              <span>Total</span>
              <span className="stat-figure">₹{order.total_amount}</span>
            </div>
          </div>

          <Button full variant="outline" className="mt-5" loading={reordering} onClick={handleReorder}>
            Order Again
          </Button>
        </div>
      </div>
    </div>
  )
}
