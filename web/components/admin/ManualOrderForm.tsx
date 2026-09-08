'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { IconPlus, IconTrash } from '@/components/ui/icons'
import CustomerPicker, { PickedCustomer } from '@/components/admin/CustomerPicker'
import { MealType, MealVariant } from '@/types/models'

interface Line {
  meal_type: MealType
  meal_variant: MealVariant
  qty: string
  amount: string // unit price
}

const emptyLine = (): Line => ({ meal_type: 'lunch', meal_variant: 'normal', qty: '1', amount: '' })
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function ManualOrderForm({ date, onAdded }: { date: string; onAdded: () => void }) {
  const { show } = useToast()
  const [customer, setCustomer] = useState<PickedCustomer | null>(null)
  const [lines, setLines] = useState<Line[]>([emptyLine()])
  const [paid, setPaid] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function addLine() {
    setLines((ls) => [...ls, emptyLine()])
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
      setLines([emptyLine()])
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
              <option value="normal">Normal</option>
              <option value="salad">Salad</option>
              <option value="wrap">Wrap</option>
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
