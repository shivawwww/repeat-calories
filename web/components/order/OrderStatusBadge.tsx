import Badge from '@/components/ui/Badge'
import { OrderStatus } from '@/types/models'

const CONFIG: Record<OrderStatus, { label: string; tone: 'green' | 'orange' | 'red' | 'gold' | 'neutral' }> = {
  pending: { label: 'Pending Payment', tone: 'gold' },
  confirmed: { label: 'Confirmed', tone: 'green' },
  payment_failed: { label: 'Payment Failed', tone: 'red' },
  preparing: { label: 'Preparing', tone: 'orange' },
  ready: { label: 'Out for Delivery', tone: 'orange' },
  delivered: { label: 'Delivered', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'red' },
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = CONFIG[status] ?? { label: status, tone: 'neutral' as const }
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>
}
