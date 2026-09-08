'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, withIds, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { IconTrash } from '@/components/ui/icons'
import { formatIST } from '@/lib/datetime'
import { Expense, ExpenseCategory } from '@/types/models'

const CATEGORIES: ExpenseCategory[] = ['groceries', 'gas', 'packaging', 'delivery', 'staff', 'rent', 'other']
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function ExpensesPanel({ onMutate }: { onMutate?: () => void }) {
  const { show } = useToast()
  const [date, setDate] = useState(() => formatIST(new Date(), 'YYYY-MM-DD'))
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState<ExpenseCategory>('groceries')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { obj } = await api.get<(Expense & { _id: string })[]>(`/api/admin/expenses/getall?date=${date}`)
      setExpenses(withIds(obj))
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

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!description.trim()) return setError('Add a description')
    if (!(Number(amount) > 0)) return setError('Enter an amount')
    setBusy(true)
    try {
      await api.post('/api/admin/expenses/add', { date, category, description: description.trim(), amount: Number(amount) })
      setDescription('')
      setAmount('')
      show('Expense added', 'success')
      refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add expense')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    try {
      await api.del(`/api/admin/expenses/${id}`)
      refresh()
    } catch {
      show('Could not delete', 'error')
    }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <section className="rounded-3xl border border-cream-deep bg-cream-soft p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Daily Expenses</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border-2 border-cream-deep bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-green"
        />
      </div>

      <p className="mt-3 text-sm text-orange-dark">
        Total <b className="stat-figure">{money(total)}</b>
      </p>

      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <Skeleton className="h-20" />
        ) : expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-soft">No expenses logged for this day.</p>
        ) : (
          <table className="w-full min-w-[440px] text-sm">
            <tbody className="divide-y divide-cream-deep">
              {expenses.map((x) => (
                <tr key={x.id}>
                  <td className="py-2.5 pr-3 capitalize text-ink-soft">{x.category}</td>
                  <td className="py-2.5 pr-3 text-ink">{x.description}</td>
                  <td className="stat-figure py-2.5 pr-3 text-right text-ink">{money(x.amount)}</td>
                  <td className="py-2.5 text-right">
                    <button type="button" onClick={() => remove(x.id)} className="text-ink-soft hover:text-red" aria-label="Delete">
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={add} className="mt-5 grid gap-3 rounded-3xl border border-cream-deep bg-white/60 p-4 sm:grid-cols-[1fr_1.5fr_0.8fr_auto] sm:items-end">
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </Select>
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Amount (₹)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button type="submit" size="sm" loading={busy}>
          Add
        </Button>
        {error && <p className="text-xs font-medium text-red sm:col-span-4">{error}</p>}
      </form>
    </section>
  )
}
