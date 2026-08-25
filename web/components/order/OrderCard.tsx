import Link from 'next/link'
import OrderStatusBadge from './OrderStatusBadge'
import { Order } from '@/types/models'
import { formatIST } from '@/lib/datetime'

export default function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <Link
      href={`/orders/${order.order_number}`}
      className="block rounded-3xl border border-cream-deep bg-cream-soft p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold text-ink">{order.order_number}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{formatIST(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-3 truncate text-sm text-ink-soft">
        {order.items.map((i) => i.name).join(', ')}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-ink-soft">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        <span className="stat-figure font-display text-base font-bold text-ink">₹{order.total_amount}</span>
      </div>
    </Link>
  )
}
