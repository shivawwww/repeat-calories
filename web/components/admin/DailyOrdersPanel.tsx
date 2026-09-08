'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, withIds } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import { IconTrash } from '@/components/ui/icons'
import { formatIST } from '@/lib/datetime'
import { Order } from '@/types/models'
import ManualOrderForm from '@/components/admin/ManualOrderForm'

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function DailyOrdersPanel({ onMutate }: { onMutate?: () => void }) {
  const { show } = useToast()
  const [date, setDate] = useState(() => formatIST(new Date(), 'YYYY-MM-DD'))
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { obj } = await api.get<(Order & { _id: string })[]>(`/api/admin/orders/getall?date=${date}`)
      setOrders(withIds(obj))
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / on date change
    load()
  }, [load])

  function refresh() {
    load()
    onMutate?.()
  }

  async function togglePaid(o: Order) {
    try {
      await api.patch(`/api/admin/orders/${o.id}/payment`, { paid: o.payment_status !== 'paid' })
      refresh()
    } catch {
      show('Could not update payment', 'error')
    }
  }

  async function remove(o: Order) {
    if (!confirm(`Delete ${o.order_number}?`)) return
    try {
      await api.del(`/api/admin/orders/${o.id}`)
      show('Order deleted', 'success')
      refresh()
    } catch {
      show('Could not delete', 'error')
    }
  }

  const received = orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + o.total_amount, 0)
  const unpaid = orders.filter((o) => o.payment_status !== 'paid').reduce((s, o) => s + o.total_amount, 0)

  return (
    <section className="rounded-3xl border border-cream-deep bg-cream-soft p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Daily Orders</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border-2 border-cream-deep bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-green"
        />
      </div>

      <div className="mt-3 flex gap-4 text-sm">
        <span className="text-green-dark">Received <b className="stat-figure">{money(received)}</b></span>
        <span className="text-gold">Unpaid <b className="stat-figure">{money(unpaid)}</b></span>
      </div>

      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <Skeleton className="h-24" />
        ) : orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-soft">No orders logged for this day.</p>
        ) : (
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="pb-2 pr-3 font-semibold">Customer</th>
                <th className="pb-2 pr-3 font-semibold">Type</th>
                <th className="pb-2 pr-3 font-semibold">Meal</th>
                <th className="pb-2 pr-3 font-semibold">Amount</th>
                <th className="pb-2 pr-3 font-semibold">Payment</th>
                <th className="pb-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-deep">
              {orders.map((o) => {
                const manual = o.source === 'manual'
                const kind =
                  o.order_kind === 'subscription' ? 'Subscription' : manual ? 'Daily order' : 'Online'
                return (
                  <tr key={o.id}>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-ink">{o.user_snapshot.name}</p>
                      <p className="text-xs text-ink-soft">{o.user_snapshot.mobile || o.order_number}</p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={kind === 'Subscription' ? 'green' : kind === 'Online' ? 'neutral' : 'orange'}>{kind}</Badge>
                    </td>
                    <td className="py-2.5 pr-3 capitalize text-ink-soft">
                      {o.meal_type ?? '—'}
                      {o.meal_variant && o.meal_variant !== 'normal' ? ` · ${o.meal_variant}` : ''}
                      {(o.items[0]?.quantity ?? 1) > 1 ? ` ×${o.items[0].quantity}` : ''}
                    </td>
                    <td className="stat-figure py-2.5 pr-3 text-ink">{money(o.total_amount)}</td>
                    <td className="py-2.5 pr-3">
                      {manual ? (
                        <button
                          type="button"
                          onClick={() => togglePaid(o)}
                          className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                            o.payment_status === 'paid' ? 'bg-green-soft text-green-dark' : 'bg-gold/15 text-gold'
                          }`}
                        >
                          {o.payment_status === 'paid' ? 'Paid' : 'Mark paid'}
                        </button>
                      ) : (
                        <Badge tone={o.payment_status === 'paid' ? 'green' : 'gold'}>{o.payment_status}</Badge>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      {manual && (
                        <button type="button" onClick={() => remove(o)} className="text-ink-soft hover:text-red" aria-label="Delete">
                          <IconTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-5">
        <ManualOrderForm date={date} onAdded={refresh} />
      </div>
    </section>
  )
}
