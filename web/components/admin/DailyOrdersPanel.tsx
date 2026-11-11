'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, withIds } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import { IconTrash } from '@/components/ui/icons'
import { formatIST, weekdayKey, WEEKDAY_KEYS, WeekdayKey } from '@/lib/datetime'
import { DayPrices, Order, PricingSettings } from '@/types/models'
import ManualOrderForm from '@/components/admin/ManualOrderForm'

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`
const DAY_LABEL: Record<WeekdayKey, string> = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' }
const ZERO_DAYS = (): DayPrices => ({ sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 })
const EMPTY_PRICING: PricingSettings = { lunch: ZERO_DAYS(), dinner: ZERO_DAYS(), updated_at: '' }

type DayDraft = Record<WeekdayKey, string>
const emptyDraft = (): DayDraft => ({ sun: '', mon: '', tue: '', wed: '', thu: '', fri: '', sat: '' })

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

export default function DailyOrdersPanel({ onMutate }: { onMutate?: () => void }) {
  const { show } = useToast()
  const [date, setDate] = useState(() => formatIST(new Date(), 'YYYY-MM-DD'))
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [pricing, setPricing] = useState<PricingSettings>(EMPTY_PRICING)
  const [editingPricing, setEditingPricing] = useState(false)
  const [lunchDraft, setLunchDraft] = useState<DayDraft>(emptyDraft())
  const [dinnerDraft, setDinnerDraft] = useState<DayDraft>(emptyDraft())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { obj } = await api.get<(Order & { _id: string })[]>(`/api/admin/orders/getall?date=${date}`)
      setOrders(withIds(obj))
    } finally {
      setLoading(false)
    }
  }, [date])

  const loadPricing = useCallback(async () => {
    const { obj } = await api.get<PricingSettings>('/api/admin/settings/pricing')
    setPricing(obj)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount / on date change
    load()
  }, [load])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    loadPricing()
  }, [loadPricing])

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

  function startEditPricing() {
    const toDraft = (d: DayPrices): DayDraft => {
      const out = emptyDraft()
      for (const k of WEEKDAY_KEYS) out[k] = d[k] ? String(d[k]) : ''
      return out
    }
    setLunchDraft(toDraft(pricing.lunch))
    setDinnerDraft(toDraft(pricing.dinner))
    setEditingPricing(true)
  }

  async function savePricing() {
    const toPayload = (draft: DayDraft): DayPrices => {
      const out = ZERO_DAYS()
      for (const k of WEEKDAY_KEYS) out[k] = Number(draft[k]) || 0
      return out
    }
    try {
      const { obj } = await api.patch<PricingSettings>('/api/admin/settings/pricing', {
        lunch: toPayload(lunchDraft),
        dinner: toPayload(dinnerDraft),
      })
      setPricing(obj)
      setEditingPricing(false)
      show('Standard prices saved', 'success')
    } catch {
      show('Could not save prices', 'error')
    }
  }

  const received = orders.filter((o) => o.payment_status === 'paid').reduce((s, o) => s + o.total_amount, 0)
  const unpaid = orders.filter((o) => o.payment_status !== 'paid').reduce((s, o) => s + o.total_amount, 0)

  const today = weekdayKey(date)
  const todayLunch = pricing.lunch[today]
  const todayDinner = pricing.dinner[today]

  return (
    <section className="rounded-3xl border border-cream-deep bg-cream-soft p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Daily Orders</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDate((d) => shiftDate(d, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-cream-deep bg-white text-ink-soft hover:border-green"
            aria-label="Previous day"
          >
            ‹
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border-2 border-cream-deep bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-green"
          />
          <button
            type="button"
            onClick={() => setDate((d) => shiftDate(d, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-cream-deep bg-white text-ink-soft hover:border-green"
            aria-label="Next day"
          >
            ›
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-ink-soft">{formatIST(date, 'dddd, DD MMM YYYY')}</p>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="text-green-dark">Received <b className="stat-figure">{money(received)}</b></span>
        <span className="text-gold">Unpaid <b className="stat-figure">{money(unpaid)}</b></span>
        <button type="button" onClick={startEditPricing} className="ml-auto text-xs font-bold uppercase tracking-wide text-green hover:underline">
          {DAY_LABEL[today]} standard: {todayLunch ? money(todayLunch) : 'closed'} lunch / {todayDinner ? money(todayDinner) : 'closed'} dinner
        </button>
      </div>

      {editingPricing && (
        <div className="mt-2 overflow-x-auto rounded-2xl border border-cream-deep bg-white p-3">
          <table className="text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="pb-2 pr-3 font-semibold" />
                {WEEKDAY_KEYS.map((k) => (
                  <th key={k} className="pb-2 px-1.5 font-semibold">{DAY_LABEL[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pr-3 py-1 font-semibold text-ink-soft">Lunch ₹</td>
                {WEEKDAY_KEYS.map((k) => (
                  <td key={k} className="px-1.5 py-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="—"
                      value={lunchDraft[k]}
                      onChange={(e) => setLunchDraft((d) => ({ ...d, [k]: e.target.value }))}
                      className="w-16 rounded-lg border-2 border-cream-deep px-1.5 py-1 text-sm text-ink outline-none focus:border-green"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="pr-3 py-1 font-semibold text-ink-soft">Dinner ₹</td>
                {WEEKDAY_KEYS.map((k) => (
                  <td key={k} className="px-1.5 py-1">
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="—"
                      value={dinnerDraft[k]}
                      onChange={(e) => setDinnerDraft((d) => ({ ...d, [k]: e.target.value }))}
                      className="w-16 rounded-lg border-2 border-cream-deep px-1.5 py-1 text-sm text-ink outline-none focus:border-green"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-soft">Leave a day blank (or 0) for &ldquo;no standard price&rdquo; — e.g. a closed day.</p>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={savePricing} className="rounded-full bg-green px-3 py-1.5 text-xs font-bold text-cream-soft">
              Save
            </button>
            <button type="button" onClick={() => setEditingPricing(false)} className="text-xs font-bold text-ink-soft">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <Skeleton className="h-24" />
        ) : orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-soft">No orders logged for this day.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="pb-2 pr-3 font-semibold">Customer</th>
                <th className="pb-2 pr-3 font-semibold">Source</th>
                <th className="pb-2 pr-3 font-semibold">Meal</th>
                <th className="pb-2 pr-3 font-semibold">Amount</th>
                <th className="pb-2 pr-3 font-semibold">Payment</th>
                <th className="pb-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-deep">
              {orders.map((o) => {
                const manual = o.source === 'manual'
                return (
                  <tr key={o.id}>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-ink">{o.user_snapshot.name}</p>
                      <p className="text-xs text-ink-soft">{o.user_snapshot.mobile || o.order_number}</p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={manual ? 'orange' : 'neutral'}>{manual ? 'Daily order' : 'Online'}</Badge>
                    </td>
                    <td className="py-2.5 pr-3 capitalize text-ink-soft">
                      {o.meal_type ?? '—'}
                      {o.meal_variant === 'custom' ? ' · custom' : ''}
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
        <ManualOrderForm date={date} pricing={pricing} onAdded={refresh} />
      </div>
    </section>
  )
}
