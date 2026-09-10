'use client'

import { useCallback, useState } from 'react'
import { api, withIds } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { IconChevronRight } from '@/components/ui/icons'
import { formatIST } from '@/lib/datetime'
import { Order } from '@/types/models'

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

interface Group {
  key: string
  name: string
  mobile: string
  total: number
  ids: string[]
  oldest: string
}

export default function OutstandingPanel({ total, onMutate }: { total: number; onMutate?: () => void }) {
  const { show } = useToast()
  const [open, setOpen] = useState(false)
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { obj } = await api.get<(Order & { _id: string })[]>('/api/admin/orders/getall?payment=owed')
      const orders = withIds(obj)
      const map = new Map<string, Group>()
      for (const o of orders) {
        const key = o.user_snapshot.mobile || o.user_id
        const g =
          map.get(key) ??
          { key, name: o.user_snapshot.name, mobile: o.user_snapshot.mobile, total: 0, ids: [], oldest: o.created_at }
        g.total += o.total_amount
        g.ids.push(o.id)
        if (o.created_at < g.oldest) g.oldest = o.created_at
        map.set(key, g)
      }
      setGroups([...map.values()].sort((a, b) => b.total - a.total))
    } finally {
      setLoading(false)
    }
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && groups === null) load()
  }

  async function markPaid(g: Group) {
    setBusyKey(g.key)
    try {
      for (const id of g.ids) {
        await api.patch(`/api/admin/orders/${id}/payment`, { paid: true })
      }
      show(`${g.name} marked paid (${money(g.total)})`, 'success')
      load()
      onMutate?.()
    } catch {
      show('Could not update', 'error')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <section className="rounded-3xl border border-cream-deep bg-cream-soft p-6">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Outstanding Payments</h2>
        <div className="flex items-center gap-2">
          <span className="stat-figure font-display text-lg font-bold text-gold">{money(total)}</span>
          <IconChevronRight className={`h-5 w-5 text-ink-soft transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="mt-4 flex flex-col divide-y divide-cream-deep">
          {loading || groups === null ? (
            <Skeleton className="h-24" />
          ) : groups.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-soft">Everyone is paid up.</p>
          ) : (
            groups.map((g) => (
              <div key={g.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{g.name}</p>
                  <p className="text-xs text-ink-soft">
                    {g.mobile} · {g.ids.length} order{g.ids.length > 1 ? 's' : ''} · since {formatIST(g.oldest, 'DD MMM')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="stat-figure font-semibold text-ink">{money(g.total)}</span>
                  <Button size="sm" loading={busyKey === g.key} onClick={() => markPaid(g)}>
                    Mark paid
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}
