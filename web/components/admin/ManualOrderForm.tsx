'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import CustomerPicker, { PickedCustomer } from '@/components/admin/CustomerPicker'
import { MealType, MealVariant } from '@/types/models'

export default function ManualOrderForm({ date, onAdded }: { date: string; onAdded: () => void }) {
  const { show } = useToast()
  const [customer, setCustomer] = useState<PickedCustomer | null>(null)
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [variant, setVariant] = useState<MealVariant>('normal')
  const [amount, setAmount] = useState('')
  const [paid, setPaid] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!customer) return setError('Pick a customer')
    if (!(Number(amount) > 0)) return setError('Enter an amount')
    setBusy(true)
    try {
      await api.post('/api/admin/orders/manual', {
        user_id: customer.id,
        date,
        meal_type: mealType,
        meal_variant: variant,
        amount: Number(amount),
        paid,
      })
      show('Order logged', 'success')
      setCustomer(null)
      setAmount('')
      setVariant('normal')
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
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <CustomerPicker value={customer} onChange={setCustomer} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Meal" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </Select>
          <Select label="Variant" value={variant} onChange={(e) => setVariant(e.target.value as MealVariant)}>
            <option value="normal">Normal</option>
            <option value="salad">Salad</option>
            <option value="wrap">Wrap</option>
            <option value="custom">Custom</option>
          </Select>
        </div>
        <Input
          label="Amount (₹)"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <label className="flex items-end gap-2 pb-3 text-sm font-medium text-ink">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-4 w-4 accent-green" />
          Paid
        </label>
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
