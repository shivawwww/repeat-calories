'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import CustomerPicker, { PickedCustomer } from '@/components/admin/CustomerPicker'
import { formatIST } from '@/lib/datetime'
import { MealType, Subscription, SubscriptionPlan } from '@/types/models'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

interface Preview {
  count: number
  total: number
  sampleDays: { date: string; meals: { meal_type: MealType; meal_variant: string; amount: number }[] }[]
}

// UTC-only date maths so nothing drifts across the IST offset.
function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}
function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}
// Date of the Nth delivery day counting from `start` (inclusive).
function endDateFromDays(start: string, weekdays: number[], nDays: number): string {
  if (!start || !weekdays.length || !(nDays >= 1)) return ''
  let cur = start
  let count = weekdays.includes(weekdayOf(cur)) ? 1 : 0
  let guard = 0
  while (count < nDays && guard++ < 4000) {
    cur = addDays(cur, 1)
    if (weekdays.includes(weekdayOf(cur))) count++
  }
  return count >= nDays ? cur : ''
}

export default function SubscriptionForm({
  onCreated,
  existing,
}: {
  onCreated: () => void
  existing?: Subscription
}) {
  const { show } = useToast()
  const editing = !!existing
  const [customer, setCustomer] = useState<PickedCustomer | null>(null)
  const [plan, setPlan] = useState<SubscriptionPlan>(existing?.plan ?? 'lunch_dinner')
  const [startDate, setStartDate] = useState(existing?.start_date ?? formatIST(new Date(), 'YYYY-MM-DD'))
  const [durationMode, setDurationMode] = useState<'days' | 'end_date'>(editing ? 'end_date' : 'days')
  const [numDays, setNumDays] = useState('26')
  const [endDateInput, setEndDateInput] = useState(existing?.end_date ?? '')
  const [deliveryDays, setDeliveryDays] = useState<number[]>(existing?.delivery_days ?? [1, 2, 3, 4, 5, 6])
  const [priceType, setPriceType] = useState<'normal' | 'custom'>(existing?.price_type ?? 'normal')
  const [lunchPrice, setLunchPrice] = useState(existing?.lunch_price ? String(existing.lunch_price) : '')
  const [dinnerPrice, setDinnerPrice] = useState(existing?.dinner_price ? String(existing.dinner_price) : '')
  const [rotationEnabled, setRotationEnabled] = useState(existing?.rotation_enabled ?? true)
  const [rotationAppliesTo, setRotationAppliesTo] = useState<MealType>(existing?.rotation_applies_to ?? 'dinner')
  const [rotationStartWith, setRotationStartWith] = useState<'salad' | 'wrap'>(existing?.rotation_start_with ?? 'salad')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [markPaid, setMarkPaid] = useState(false)

  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsLunch = plan === 'lunch' || plan === 'lunch_dinner'
  const needsDinner = plan === 'dinner' || plan === 'lunch_dinner'

  const endDate = useMemo(
    () => (durationMode === 'days' ? endDateFromDays(startDate, deliveryDays, Number(numDays)) : endDateInput),
    [durationMode, startDate, deliveryDays, numDays, endDateInput]
  )

  const payload = useCallback(
    () => ({
      plan,
      start_date: startDate,
      end_date: endDate,
      delivery_days: deliveryDays,
      price_type: priceType,
      lunch_price: needsLunch ? Number(lunchPrice) || 0 : undefined,
      dinner_price: needsDinner ? Number(dinnerPrice) || 0 : undefined,
      rotation_enabled: plan === 'lunch_dinner' && rotationEnabled,
      rotation_applies_to: rotationAppliesTo,
      rotation_start_with: rotationStartWith,
      notes: notes.trim() || undefined,
    }),
    [plan, startDate, endDate, deliveryDays, priceType, lunchPrice, dinnerPrice, needsLunch, needsDinner, rotationEnabled, rotationAppliesTo, rotationStartWith, notes]
  )

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!startDate || !endDate || endDate < startDate) {
        setPreview(null)
        return
      }
      try {
        const { obj } = await api.post<Preview>('/api/admin/subscriptions/preview', payload())
        setPreview(obj)
      } catch {
        setPreview(null)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [startDate, endDate, payload])

  function toggleDay(d: number) {
    setDeliveryDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!editing && !customer) return setError('Pick a customer')
    if (!endDate || endDate < startDate) return setError('Set a valid duration')
    setBusy(true)
    try {
      if (editing && existing) {
        await api.patch(`/api/admin/subscriptions/${existing.id}`, payload())
        show('Subscription updated', 'success')
        onCreated()
        return
      }
      const { obj } = await api.post<{ _id: string }>('/api/admin/subscriptions/add', { user_id: customer!.id, ...payload() })
      if (markPaid && obj?._id) {
        await api.post(`/api/admin/subscriptions/${obj._id}/mark-paid`, { paid: true })
      }
      show('Subscription created', 'success')
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : editing ? 'Could not update subscription' : 'Could not create subscription')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {editing ? (
          <div className="rounded-2xl border-2 border-cream-deep bg-cream-soft px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Customer</p>
            <p className="text-sm font-semibold text-ink">{existing?.user_snapshot.name}</p>
            <p className="text-xs text-ink-soft">{existing?.user_snapshot.mobile}</p>
          </div>
        ) : (
          <CustomerPicker value={customer} onChange={setCustomer} />
        )}
        <Select label="Plan" value={plan} onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}>
          <option value="lunch">Lunch only</option>
          <option value="dinner">Dinner only</option>
          <option value="lunch_dinner">Lunch + Dinner</option>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Select label="Duration by" value={durationMode} onChange={(e) => setDurationMode(e.target.value as 'days' | 'end_date')}>
          <option value="days">Number of days</option>
          <option value="end_date">End date</option>
        </Select>
        {durationMode === 'days' ? (
          <Input
            label="How many days"
            inputMode="numeric"
            value={numDays}
            onChange={(e) => setNumDays(e.target.value)}
            hint={endDate ? `ends ${formatIST(endDate, 'DD MMM')}` : undefined}
          />
        ) : (
          <Input label="End date" type="date" value={endDateInput} min={startDate} onChange={(e) => setEndDateInput(e.target.value)} />
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Delivery days</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((w, i) => (
            <button
              key={w}
              type="button"
              onClick={() => toggleDay(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                deliveryDays.includes(i) ? 'bg-green text-cream-soft' : 'bg-cream-deep/50 text-ink-soft'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Pricing" value={priceType} onChange={(e) => setPriceType(e.target.value as 'normal' | 'custom')}>
          <option value="normal">Normal</option>
          <option value="custom">Custom</option>
        </Select>
        <div />
        {needsLunch && <Input label="Lunch price / day (₹)" inputMode="decimal" value={lunchPrice} onChange={(e) => setLunchPrice(e.target.value)} />}
        {needsDinner && <Input label="Dinner price / day (₹)" inputMode="decimal" value={dinnerPrice} onChange={(e) => setDinnerPrice(e.target.value)} />}
      </div>

      {plan === 'lunch_dinner' && (
        <div className="rounded-2xl border border-cream-deep bg-white/60 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={rotationEnabled} onChange={(e) => setRotationEnabled(e.target.checked)} className="h-4 w-4 accent-green" />
            Alternate salad / wrap
          </label>
          {rotationEnabled && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Select label="On which meal" value={rotationAppliesTo} onChange={(e) => setRotationAppliesTo(e.target.value as MealType)}>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </Select>
              <Select label="Day 1 is" value={rotationStartWith} onChange={(e) => setRotationStartWith(e.target.value as 'salad' | 'wrap')}>
                <option value="salad">Salad</option>
                <option value="wrap">Wrap</option>
              </Select>
            </div>
          )}
        </div>
      )}

      <Textarea label="Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

      {!editing && (
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={markPaid} onChange={(e) => setMarkPaid(e.target.checked)} className="h-4 w-4 accent-green" />
          Amount already paid in full
        </label>
      )}

      {editing && (
        <p className="rounded-2xl bg-gold/10 px-4 py-2 text-xs text-ink-soft">
          Saving regenerates upcoming meals. Meals already marked paid or delivered are kept.
        </p>
      )}

      {preview && (
        <div className="rounded-2xl bg-green-soft p-4 text-sm text-green-dark">
          <p className="font-semibold">
            {preview.count} meals · {money(preview.total)} total
          </p>
          {preview.sampleDays.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {preview.sampleDays.map((d) => (
                <li key={d.date}>
                  {formatIST(d.date, 'ddd DD MMM')}:{' '}
                  {d.meals.map((m) => `${m.meal_type} ${m.meal_variant} ₹${m.amount}`).join('  ·  ')}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-xs font-medium text-red">{error}</p>}

      <Button type="submit" full loading={busy}>
        {editing ? 'Save changes' : 'Create subscription'}
      </Button>
    </form>
  )
}
