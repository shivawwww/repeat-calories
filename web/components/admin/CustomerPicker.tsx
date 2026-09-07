'use client'

import { useEffect, useRef, useState } from 'react'
import { api, withIds, ApiError } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { User } from '@/types/models'

export interface PickedCustomer {
  id: string
  name: string
  mobile: string
}

// Type-ahead over walk-in customers with an inline "add new" fallback.
export default function CustomerPicker({
  value,
  onChange,
}: {
  value: PickedCustomer | null
  onChange: (c: PickedCustomer | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newMobile, setNewMobile] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) return
    const t = setTimeout(async () => {
      try {
        const { obj } = await api.get<(User & { _id: string })[]>(
          `/api/admin/customers/getall${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`
        )
        setResults(withIds(obj).slice(0, 8))
      } catch {
        /* ignore */
      }
    }, 200)
    return () => clearTimeout(t)
  }, [query, value])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-2xl border-2 border-green bg-green-soft px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">{value.name}</p>
          <p className="text-xs text-ink-soft">{value.mobile}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="text-xs font-bold uppercase tracking-wide text-green hover:underline">
          Change
        </button>
      </div>
    )
  }

  async function createCustomer() {
    setError(null)
    if (!query.trim() || newMobile.replace(/\D/g, '').length < 10) {
      setError('Enter a name and a valid 10-digit mobile')
      return
    }
    setBusy(true)
    try {
      const { obj } = await api.post<User & { _id: string }>('/api/admin/customers/add', {
        name: query.trim(),
        mobile: newMobile.trim(),
      })
      const c = withIds([obj])[0]
      onChange({ id: c.id, name: c.name, mobile: c.mobile })
      setAdding(false)
      setQuery('')
      setNewMobile('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not add customer')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <Input
        label="Customer"
        placeholder="Search by name or mobile"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setAdding(false)
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />

      {open && !adding && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-cream-deep bg-white shadow-lg">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onChange({ id: r.id, name: r.name, mobile: r.mobile })
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-cream"
            >
              <span className="font-medium text-ink">{r.name}</span>
              <span className="text-xs text-ink-soft">{r.mobile}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setAdding(true)
              setOpen(false)
            }}
            className="w-full border-t border-cream-deep px-4 py-2.5 text-left text-sm font-semibold text-green hover:bg-cream"
          >
            ＋ Add new customer{query.trim() ? ` “${query.trim()}”` : ''}
          </button>
        </div>
      )}

      {adding && (
        <div className="mt-2 rounded-2xl border border-cream-deep bg-cream-soft p-3">
          <Input label="Name" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="mt-2">
            <Input
              label="Mobile"
              inputMode="numeric"
              value={newMobile}
              onChange={(e) => setNewMobile(e.target.value)}
            />
          </div>
          {error && <p className="mt-1.5 text-xs font-medium text-red">{error}</p>}
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={createCustomer} loading={busy}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
