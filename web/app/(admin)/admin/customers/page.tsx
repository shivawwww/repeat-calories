'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, withIds, ApiError } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Skeleton from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { IconSearch } from '@/components/ui/icons'
import { formatIST } from '@/lib/datetime'
import { User } from '@/types/models'

interface Draft {
  id?: string
  name: string
  mobile: string
  area: string
  notes: string
}

const EMPTY: Draft = { name: '', mobile: '', area: '', notes: '' }

export default function AdminCustomersPage() {
  const { show } = useToast()
  const [customers, setCustomers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { obj } = await api.get<(User & { _id: string })[]>('/api/admin/customers/getall')
      setCustomers(withIds(obj))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return
    setError(null)
    setBusy(true)
    try {
      if (draft.id) {
        await api.patch(`/api/admin/customers/${draft.id}`, {
          name: draft.name,
          mobile: draft.mobile,
          area: draft.area,
          notes: draft.notes,
        })
      } else {
        await api.post('/api/admin/customers/add', {
          name: draft.name,
          mobile: draft.mobile,
          area: draft.area,
          notes: draft.notes,
        })
      }
      show('Saved', 'success')
      setDraft(null)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? customers.filter((c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q))
    : customers

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Customers</h1>
        <Button size="sm" onClick={() => setDraft({ ...EMPTY })}>
          Add customer
        </Button>
      </div>
      <p className="mt-1 text-sm text-ink-soft">Walk-in / phone customers whose orders you log by hand.</p>

      <div className="mt-5 flex items-center gap-2 rounded-2xl border-2 border-cream-deep bg-cream-soft px-4 py-2.5">
        <IconSearch className="h-4 w-4 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or mobile"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/50"
        />
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-soft">No customers found.</p>
        ) : (
          filtered.map((c) => {
            const addr = c.addresses?.find((a) => a.is_default) ?? c.addresses?.[0]
            return (
              <button
                key={c.id}
                onClick={() =>
                  setDraft({ id: c.id, name: c.name, mobile: c.mobile, area: addr?.area ?? '', notes: c.walkin_notes ?? '' })
                }
                className="flex items-center justify-between rounded-2xl border border-cream-deep bg-cream-soft px-4 py-3 text-left transition-colors hover:border-green"
              >
                <div>
                  <p className="font-semibold text-ink">{c.name}</p>
                  <p className="text-xs text-ink-soft">
                    {c.mobile}
                    {addr?.area ? ` · ${addr.area}` : ''}
                  </p>
                </div>
                <span className="text-xs text-ink-soft">{formatIST(c.created_at, 'DD MMM YYYY')}</span>
              </button>
            )
          })
        )}
      </div>

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit customer' : 'Add customer'}>
        {draft && (
          <form onSubmit={save} className="flex flex-col gap-4">
            <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
            <Input
              label="Mobile"
              inputMode="numeric"
              value={draft.mobile}
              onChange={(e) => setDraft({ ...draft, mobile: e.target.value })}
              required
            />
            <Input label="Area (optional)" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} />
            <Input label="Notes (optional)" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            {error && <p className="text-xs font-medium text-red">{error}</p>}
            <Button type="submit" full loading={busy}>
              Save
            </Button>
          </form>
        )}
      </Modal>
    </div>
  )
}
