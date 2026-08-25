'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, withIds } from '@/lib/api'
import { Order } from '@/types/models'
import OrderCard from '@/components/order/OrderCard'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { IconReceipt } from '@/components/ui/icons'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<(Order & { _id: string })[]>('/api/orders/mine')
      .then(({ obj }) => setOrders(withIds(obj)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream-deep/50 text-green">
          <IconReceipt className="h-9 w-9" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink">No orders yet</h1>
        <p className="mt-1.5 max-w-xs text-sm text-ink-soft">Once you place an order, you&apos;ll be able to track it here.</p>
        <Link href="/menu">
          <Button className="mt-6">Browse Menu</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="pb-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Your Orders</h1>
      <div className="mt-6 flex flex-col gap-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}
