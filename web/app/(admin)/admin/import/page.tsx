'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api'
import Button from '@/components/ui/Button'

const SEED = {
  customers: [
    { name: 'Vishwa', mobile: '8220710970' },
    { name: 'Tamil', mobile: '9360329755' },
    { name: 'Anjali', mobile: '9025374278' },
    { name: 'Arjit', mobile: '8124025297' },
    { name: 'Ragul', mobile: '9025008688' },
    { name: 'Riyas', mobile: '8189999299' },
    { name: 'Kishore', mobile: '9488561682' },
    { name: 'Krishna', mobile: '6381770152' },
    { name: 'Rithika', mobile: '7708196298' },
    { name: 'Mohan Dapsa', mobile: '9677996060' },
    { name: 'Pranesh', mobile: '8608662901' },
    { name: 'Bingo', mobile: '8610802674' },
    { name: 'Venkatesh', mobile: '9994246211' },
  ],
  subscriptions: [
    {
      user_name: 'Vishwa', user_mobile: '8220710970', plan: 'lunch_dinner',
      start_date: '2026-09-04', end_date: '2026-09-10', lunch_price: 220, dinner_price: 170,
      rotation_enabled: true, rotation_applies_to: 'dinner', rotation_start_with: 'wrap',
      paid: false, delivered_through: '2026-09-09', skip: [{ date: '2026-09-07', meal_type: 'dinner' }],
    },
    {
      user_name: 'Tamil', user_mobile: '9360329755', plan: 'lunch_dinner',
      start_date: '2026-09-03', end_date: '2026-09-09', lunch_price: 199, dinner_price: 169,
      rotation_enabled: true, rotation_applies_to: 'dinner', rotation_start_with: 'wrap',
      paid: true, delivered_through: '2026-09-09',
    },
    {
      user_name: 'Arjit', user_mobile: '8124025297', plan: 'lunch',
      start_date: '2026-09-04', end_date: '2026-09-07', lunch_price: 159, paid: false, delivered_through: '2026-09-09',
    },
    {
      user_name: 'Arjit', user_mobile: '8124025297', plan: 'lunch',
      start_date: '2026-09-08', end_date: '2026-09-11', lunch_price: 190, paid: false, delivered_through: '2026-09-09',
    },
    {
      user_name: 'Ragul', user_mobile: '9025008688', plan: 'lunch',
      start_date: '2026-08-29', end_date: '2026-09-04', lunch_price: 159, paid: true, delivered_through: '2026-09-09',
    },
    {
      user_name: 'Ragul', user_mobile: '9025008688', plan: 'lunch',
      start_date: '2026-09-05', end_date: '2026-09-11', lunch_price: 159, paid: true, delivered_through: '2026-09-09',
    },
  ],
  orders: [
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-07', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-08', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 130, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-09', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, paid: false, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-10', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 130, paid: false },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-11', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, paid: false },
    { customer_name: 'Vishwa', customer_mobile: '8220710970', date: '2026-09-11', meal_type: 'dinner', meal_variant: 'wrap', amount: 170, paid: false, notes: 'Make-up for Sep 7 dinner' },

    // Walk-in / one-off orders — all paid, all delivered
    { customer_name: 'Abhilash', customer_mobile: '9003151312', date: '2026-08-29', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 150, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Abhilash', customer_mobile: '9003151312', date: '2026-08-29', meal_type: 'dinner', meal_variant: 'salad', amount: 150, quantity: 3, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Abhilash', customer_mobile: '9003151312', date: '2026-08-29', meal_type: 'dinner', meal_variant: 'wrap', amount: 120, quantity: 3, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Indresh', customer_mobile: '9976987821', date: '2026-08-31', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Indresh', customer_mobile: '9976987821', date: '2026-08-31', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Indresh', customer_mobile: '9976987821', date: '2026-08-31', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Nandhini', customer_mobile: '9629162288', date: '2026-08-29', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Mohan coach', customer_mobile: '7373994232', date: '2026-08-31', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Vignesh Ravikumar', customer_mobile: '9444872677', date: '2026-09-01', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Arjit', customer_mobile: '8124025297', date: '2026-09-02', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Arjit', customer_mobile: '8124025297', date: '2026-09-03', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Riyas', customer_mobile: '8189999299', date: '2026-09-03', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-03', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },

    // Batch 3
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-02', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-03', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 159, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-03', meal_type: 'dinner', meal_variant: 'salad', amount: 129, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-03', meal_type: 'dinner', meal_variant: 'wrap', amount: 129, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Krishna', customer_mobile: '6381770152', date: '2026-09-03', meal_type: 'dinner', meal_variant: 'salad', amount: 140, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Krishna', customer_mobile: '6381770152', date: '2026-09-04', meal_type: 'dinner', meal_variant: 'salad', amount: 150, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Mohan Dapsa', customer_mobile: '9677996060', date: '2026-09-03', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Rithika', customer_mobile: '7708196298', date: '2026-09-03', meal_type: 'dinner', meal_variant: 'salad', amount: 140, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Rithika', customer_mobile: '7708196298', date: '2026-09-03', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Indresh', customer_mobile: '9976987821', date: '2026-09-02', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 140, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Indresh', customer_mobile: '9976987821', date: '2026-09-02', meal_type: 'dinner', meal_variant: 'salad', amount: 140, quantity: 1, paid: true, delivery_state: 'delivered' },

    // Batch 4 — all Sep 5, paid + delivered
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-05', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 185, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'salad', amount: 140, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Anjali', customer_mobile: '9025374278', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'wrap', amount: 120, quantity: 3, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Pranesh', customer_mobile: '8608662901', date: '2026-09-05', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Pranesh', customer_mobile: '8608662901', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Bingo', customer_mobile: '8610802674', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'salad', amount: 150, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Venkatesh', customer_mobile: '9994246211', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'salad', amount: 130, quantity: 2, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Abhilash', customer_mobile: '9003151312', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'salad', amount: 133.33, quantity: 3, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Abhilash', customer_mobile: '9003151312', date: '2026-09-05', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 2, paid: true, delivery_state: 'delivered' },

    // Batch 5
    { customer_name: 'Kishore', customer_mobile: '9488561682', date: '2026-09-07', meal_type: 'dinner', meal_variant: 'wrap', amount: 130, quantity: 1, paid: true, delivery_state: 'delivered' },
    { customer_name: 'Krishna', customer_mobile: '6381770152', date: '2026-09-07', meal_type: 'lunch', meal_variant: 'rice_bowl', amount: 160, quantity: 1, paid: true, delivery_state: 'delivered' },
  ],
  expenses: [],
}

export default function AdminImportPage() {
  const [text, setText] = useState(JSON.stringify(SEED, null, 2))
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function run() {
    setResult(null)
    let payload: unknown
    try {
      payload = JSON.parse(text)
    } catch {
      setResult('❌ Invalid JSON')
      return
    }
    setBusy(true)
    try {
      const { obj, message } = await api.post<Record<string, unknown>>('/api/admin/import/legacy', payload)
      setResult(`✅ ${message}\n\n${JSON.stringify(obj, null, 2)}`)
    } catch (e) {
      setResult(`❌ ${e instanceof ApiError ? e.message : 'Import failed'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Import</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Paste an import payload and run it. Safe to run twice — customers dedupe by mobile, orders by
        customer+date+meal, subscriptions by customer+plan+dates, expenses by exact match.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="mt-4 h-[420px] w-full rounded-2xl border-2 border-cream-deep bg-white p-4 font-mono text-xs text-ink outline-none focus:border-green"
      />

      <div className="mt-3">
        <Button onClick={run} loading={busy}>
          Run import
        </Button>
      </div>

      {result && (
        <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-cream-soft p-4 text-xs text-ink">
          {result}
        </pre>
      )}
    </div>
  )
}
