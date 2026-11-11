'use client'

import { useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { IconPlus, IconTrash } from '@/components/ui/icons'
import { weekdayKey } from '@/lib/datetime'
import CustomerPicker, { PickedCustomer } from '@/components/admin/CustomerPicker'
import { MealType, MealVariant, PricingSettings } from '@/types/models'

interface Line {
  meal_type: MealType
  meal_variant: MealVariant
  qty: string
  amount: string // unit price
}

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

// 0 in the settings means "no standard price that day" (kitchen closed etc.) —
// never auto-fill in that case, forcing the admin to notice and use Custom.
function standardPriceFor(meal: MealType, date: string, pricing: PricingSettings): number {
  const day = weekdayKey(date)
  return (meal === 'lunch' ? pricing.lunch : pricing.dinner)[day]
}

function newLine(date: string, pricing: PricingSettings): Line {
  const price = standardPriceFor('lunch', date, pricing)
  return { meal_type: 'lunch', meal_variant: 'standard', qty: '1', amount: price > 0 ? String(price) : '' }
}

export default function ManualOrderForm({
  date,
  pricing,
  onAdded,
}: {
  date: string
  pricing: PricingSettings
  onAdded: () => void
}) {
  const { show } = useToast()
  const [customer, setCustomer] = useState<PickedCustomer | null>(null)
  const [lines, setLines] = useState<Line[]>([newLine(date, pricing)])
  const [paid, setPaid] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Once pricing loads, prefill any line still sitting on "Standard" with an
  // empty amount (never overwrites a value the admin already typed).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing form state to the pricing settings once they load
    setLines((ls) =>
      ls.map((l) => {
        if (l.meal_variant !== 'standard' || l.amount !== '') return l
        const price = standardPriceFor(l.meal_type, date, pricing)
        return price > 0 ? { ...l, amount: String(price) } : l
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- date changes are handled by the effect below
  }, [pricing])

  // Changing the day being logged always re-syncs every "Standard" line to that
  // day's price — including clearing it back to blank on a day with no standard
  // price (e.g. closed), so a stale price from a previous day never lingers.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing form state to the newly selected date
    setLines((ls) =>
      ls.map((l) => {
        if (l.meal_variant !== 'standard') return l
        const price = standardPriceFor(l.meal_type, date, pricing)
        return { ...l, amount: price > 0 ? String(price) : '' }
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pricing changes are handled by the effect above
  }, [date])

  function update(i: number, patch: Partial<Line>) {
    setLines((ls) =>
      ls.map((l, idx) => {
        if (idx !== i) return l
        const next = { ...l, ...patch }
        // Switching to/within "Standard" always re-fills the configured price.
        if (('meal_type' in patch || 'meal_variant' in patch) && next.meal_variant === 'standard') {
          const price = standardPriceFor(next.meal_type, date, pricing)
          next.amount = price > 0 ? String(price) : ''
        }
        return next
      })
    )
  }
  function addLine() {
    setLines((ls) => [...ls, newLine(date, pricing)])
  }
  function removeLine(i: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)))
  }

  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0) * (Number(l.qty) || 0), 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!customer) return setError('Pick a customer')
    const clean = lines
      .map((l) => ({ ...l, q: Number(l.qty), a: Number(l.amount) }))
      .filter((l) => l.q >= 1 && l.a > 0)
    if (clean.length === 0) return setError('Add at least one item with a quantity and amount')

    setBusy(true)
    try {
      for (const l of clean) {
        await api.post('/api/admin/orders/manual', {
          user_id: customer.id,
          date,
          meal_type: l.meal_type,
          meal_variant: l.meal_variant,
          amount: l.a,
          quantity: l.q,
          paid,
        })
      }
      show(`Logged ${clean.length} item${clean.length > 1 ? 's' : ''}`, 'success')
      setCustomer(null)
      setLines([newLine(date, pricing)])
      setPaid(true)
      onAdded()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log order')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-cream-deep bg-cream-soft p-4">
      <p className="font-display text-sm font-semibold text-ink">Log an order for {date}</p>

      <div className="mt-3">
        <CustomerPicker value={customer} onChange={setCustomer} />
      </div>

      <div className="mt-3 space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto_1fr_auto] sm:items-end">
            <Select
              label={i === 0 ? 'Meal' : undefined}
              value={l.meal_type}
              onChange={(e) => update(i, { meal_type: e.target.value as MealType })}
            >
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </Select>
            <Select
              label={i === 0 ? 'Variant' : undefined}
              value={l.meal_variant}
              onChange={(e) => update(i, { meal_variant: e.target.value as MealVariant })}
            >
              <option value="standard">Standard</option>
              <option value="custom">Custom</option>
            </Select>
            <Input
              label={i === 0 ? 'Qty' : undefined}
              inputMode="numeric"
              className="sm:w-16"
              value={l.qty}
              onChange={(e) => update(i, { qty: e.target.value })}
            />
            <Input
              label={i === 0 ? 'Unit ₹' : undefined}
              inputMode="decimal"
              value={l.amount}
              onChange={(e) => update(i, { amount: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeLine(i)}
              disabled={lines.length === 1}
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-ink-soft hover:text-red disabled:opacity-30"
              aria-label="Remove item"
            >
              <IconTrash />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addLine} className="mt-1 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-green hover:underline">
        <IconPlus className="h-4 w-4" /> Add item
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-4 w-4 accent-green" />
          Paid
        </label>
        <span className="text-sm text-ink-soft">
          Total <b className="stat-figure text-ink">{money(total)}</b>
        </span>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-red">{error}</p>}

      <div className="mt-3">
        <Button type="submit" size="sm" loading={busy}>
          Add order
        </Button>
      </div>
    </form>
  )
}
