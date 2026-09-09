'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, withIds } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Skeleton from '@/components/ui/Skeleton'
import SubscriptionForm from '@/components/admin/SubscriptionForm'
import SubscriptionDeliveries from '@/components/admin/SubscriptionDeliveries'
import { formatIST } from '@/lib/datetime'
import { Subscription } from '@/types/models'

const PLAN_LABEL: Record<string, string> = {
  lunch: 'Lunch',
  dinner: 'Dinner',
  lunch_dinner: 'Lunch + Dinner',
}
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function AdminSubscriptionsPage() {
  const { show } = useToast()
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deliveriesFor, setDeliveriesFor] = useState<Subscription | null>(null)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [filter, setFilter] = useState<'active' | 'all' | 'paused' | 'ended'>('active')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { obj } = await api.get<(Subscription & { _id: string })[]>('/api/admin/subscriptions/getall')
      setSubs(withIds(obj))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load()
  }, [load])

  async function setStatus(id: string, status: string) {
    try {
      await api.patch(`/api/admin/subscriptions/${id}`, { status })
      show('Updated', 'success')
      load()
    } catch {
      show('Could not update', 'error')
    }
  }

  async function markPaid(id: string, paid: boolean) {
    try {
      await api.post(`/api/admin/subscriptions/${id}/mark-paid`, { paid })
      show(paid ? 'Marked fully paid' : 'Marked unpaid', 'success')
      load()
    } catch {
      show('Could not update payment', 'error')
    }
  }

  async function addDays(id: string) {
    const raw = prompt('How many make-up days to add?', '1')
    const count = Number(raw)
    if (!Number.isInteger(count) || count < 1) return
    try {
      const { obj } = await api.post<{ new_end_date: string; days_added: number }>(
        `/api/admin/subscriptions/${id}/add-days`,
        { count }
      )
      show(`Added ${obj.days_added} day(s) — now ends ${obj.new_end_date}`, 'success')
      load()
    } catch {
      show('Could not add days', 'error')
    }
  }

  async function regenerate(id: string) {
    try {
      const { obj } = await api.post<{ generated_count: number }>(`/api/admin/subscriptions/${id}/regenerate`)
      show(`Regenerated — ${obj.generated_count} orders`, 'success')
      load()
    } catch {
      show('Could not regenerate', 'error')
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this subscription and its unpaid orders?')) return
    try {
      await api.del(`/api/admin/subscriptions/${id}`)
      show('Deleted', 'success')
      load()
    } catch {
      show('Could not delete', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Subscriptions</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          New subscription
        </Button>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New subscription">
        <SubscriptionForm
          onCreated={() => {
            setShowForm(false)
            load()
          }}
        />
      </Modal>

      <Modal open={!!editingSub} onClose={() => setEditingSub(null)} title="Edit subscription">
        {editingSub && (
          <SubscriptionForm
            existing={editingSub}
            onCreated={() => {
              setEditingSub(null)
              load()
            }}
          />
        )}
      </Modal>

      {deliveriesFor && (
        <SubscriptionDeliveries
          subscriptionId={deliveriesFor.id}
          name={deliveriesFor.user_snapshot.name}
          open={!!deliveriesFor}
          onClose={() => setDeliveriesFor(null)}
          onChange={load}
        />
      )}

      <div className="mt-5 flex gap-2">
        {(['active', 'paused', 'ended', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
              filter === f ? 'bg-green text-cream-soft' : 'bg-cream-deep/50 text-ink-soft hover:bg-cream-deep'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44" />)
        ) : (
          (() => {
            const visible = filter === 'all' ? subs : subs.filter((s) => s.status === filter)
            if (visible.length === 0)
              return <p className="py-16 text-center text-sm text-ink-soft">No {filter === 'all' ? '' : filter} subscriptions.</p>
            return visible.map((s) => {
            const st = s.stats
            const fullyPaid = st ? st.meals_unpaid === 0 && st.meals_paid > 0 : false
            return (
              <div key={s.id} className="rounded-3xl border border-cream-deep bg-cream-soft p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingSub(s)}
                        className="font-display text-base font-bold text-ink hover:text-green hover:underline"
                      >
                        {s.user_snapshot.name}
                      </button>
                      <Badge tone={s.status === 'active' ? 'green' : s.status === 'paused' ? 'gold' : 'neutral'}>{s.status}</Badge>
                      <Badge tone={fullyPaid ? 'green' : 'gold'}>{fullyPaid ? 'paid' : 'payment due'}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">{s.user_snapshot.mobile}</p>
                  </div>
                  <div className="text-right">
                    <p className="stat-figure font-display text-lg font-bold text-ink">{money(s.total_amount)}</p>
                    <p className="text-xs text-ink-soft">{PLAN_LABEL[s.plan] ?? s.plan}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                  <span>
                    {formatIST(s.start_date, 'DD MMM')} – {formatIST(s.end_date, 'DD MMM YYYY')}
                  </span>
                  {s.lunch_price ? <span>Lunch ₹{s.lunch_price}</span> : null}
                  {s.dinner_price ? <span>Dinner ₹{s.dinner_price}</span> : null}
                  {s.rotation_enabled && (
                    <span>
                      {s.rotation_applies_to} salad/wrap from {s.rotation_start_with}
                    </span>
                  )}
                </div>

                {st && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <Stat label="Delivered" value={`${st.meals_delivered} / ${st.meals_total}`} tone="green" />
                    <Stat label="Not sent" value={String(st.meals_skipped)} tone="gold" />
                    <Stat label="To go" value={String(st.meals_remaining)} />
                    <Stat label="Paid" value={money(st.amount_paid)} sub={`${st.meals_paid} meals`} tone="green" />
                    <Stat label="Unpaid" value={money(st.amount_unpaid)} sub={`${st.meals_unpaid} meals`} tone="gold" />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setDeliveriesFor(s)}>
                    Deliveries
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingSub(s)}>
                    Edit
                  </Button>
                  {st && st.meals_unpaid > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => markPaid(s.id, true)}>
                      Mark fully paid
                    </Button>
                  )}
                  {st && st.meals_paid > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => markPaid(s.id, false)}>
                      Mark unpaid
                    </Button>
                  )}
                  {s.status !== 'active' && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(s.id, 'active')}>
                      Resume
                    </Button>
                  )}
                  {s.status === 'active' && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(s.id, 'paused')}>
                      Pause
                    </Button>
                  )}
                  {s.status !== 'ended' && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(s.id, 'ended')}>
                      End
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => addDays(s.id)}>
                    ＋ Make-up days
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => regenerate(s.id)}>
                    Regenerate
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(s.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            )
            })
          })()
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'green' | 'gold' }) {
  const color = tone === 'green' ? 'text-green-dark' : tone === 'gold' ? 'text-gold' : 'text-ink'
  return (
    <div className="rounded-2xl bg-white/60 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={`stat-figure text-sm font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-ink-soft">{sub}</p>}
    </div>
  )
}
