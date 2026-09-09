'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, withIds } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'
import Skeleton from '@/components/ui/Skeleton'
import { formatIST } from '@/lib/datetime'
import { Order } from '@/types/models'

const variantLabel = (v?: string) => (v && v !== 'rice_bowl' ? v.replace('_', ' ') : 'rice bowl')

// Day-by-day delivery checklist for one subscription. Tick each meal as it goes
// out; mark "not sent" for a miss (then add a make-up day from the card).
export default function SubscriptionDeliveries({
  subscriptionId,
  name,
  open,
  onClose,
  onChange,
}: {
  subscriptionId: string
  name: string
  open: boolean
  onClose: () => void
  onChange: () => void
}) {
  const { show } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { obj } = await api.get<(Order & { _id: string })[]>(
        `/api/admin/orders/getall?subscription_id=${subscriptionId}`
      )
      setOrders(withIds(obj).sort((a, b) => a.created_at.localeCompare(b.created_at)))
    } finally {
      setLoading(false)
    }
  }, [subscriptionId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on open
    if (open) load()
  }, [open, load])

  async function mark(o: Order, state: 'delivered' | 'skipped') {
    const next = o.delivery_state === state ? 'pending' : state
    // optimistic
    setOrders((os) => os.map((x) => (x.id === o.id ? { ...x, delivery_state: next as Order['delivery_state'] } : x)))
    try {
      await api.patch(`/api/admin/orders/${o.id}/delivery`, { state: next })
      onChange()
    } catch {
      show('Could not update', 'error')
      load()
    }
  }

  const delivered = orders.filter((o) => o.delivery_state === 'delivered').length
  const skipped = orders.filter((o) => o.delivery_state === 'skipped').length

  return (
    <Modal open={open} onClose={onClose} title={`${name} — deliveries`}>
      {loading ? (
        <Skeleton className="h-64" />
      ) : orders.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">No meals generated.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-soft">
            <b className="text-green-dark">{delivered}</b> delivered · <b className="text-gold">{skipped}</b> not sent ·{' '}
            {orders.length - delivered - skipped} to go
          </p>
          <div className="flex flex-col divide-y divide-cream-deep">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{formatIST(o.created_at, 'ddd DD MMM')}</p>
                  <p className="truncate text-xs capitalize text-ink-soft">
                    {o.meal_type} · {variantLabel(o.meal_variant)} · ₹{o.total_amount}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => mark(o, 'delivered')}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      o.delivery_state === 'delivered' ? 'bg-green text-cream-soft' : 'bg-cream-deep/50 text-ink-soft'
                    }`}
                  >
                    ✓ Given
                  </button>
                  <button
                    type="button"
                    onClick={() => mark(o, 'skipped')}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      o.delivery_state === 'skipped' ? 'bg-red text-cream-soft' : 'bg-cream-deep/50 text-ink-soft'
                    }`}
                  >
                    Not sent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}
