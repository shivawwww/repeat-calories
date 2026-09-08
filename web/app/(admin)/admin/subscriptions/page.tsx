'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, withIds } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import SubscriptionForm from '@/components/admin/SubscriptionForm'
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
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Close' : 'New subscription'}
        </Button>
      </div>

      {showForm && (
        <div className="mt-6">
          <SubscriptionForm
            onCreated={() => {
              setShowForm(false)
              load()
            }}
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)
        ) : subs.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-soft">No subscriptions yet.</p>
        ) : (
          subs.map((s) => (
            <div key={s.id} className="rounded-3xl border border-cream-deep bg-cream-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base font-bold text-ink">{s.user_snapshot.name}</p>
                    <Badge tone={s.status === 'active' ? 'green' : s.status === 'paused' ? 'gold' : 'neutral'}>{s.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">{s.user_snapshot.mobile}</p>
                </div>
                <div className="text-right">
                  <p className="stat-figure font-display text-lg font-bold text-ink">{money(s.total_amount)}</p>
                  <p className="text-xs text-ink-soft">{s.generated_count} orders</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                <span>{PLAN_LABEL[s.plan] ?? s.plan}</span>
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

              <div className="mt-4 flex flex-wrap gap-2">
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
                <Button size="sm" variant="ghost" onClick={() => regenerate(s.id)}>
                  Regenerate
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(s.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
