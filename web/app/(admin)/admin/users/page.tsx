'use client'

import { useEffect, useState } from 'react'
import { api, withIds, ApiError } from '@/lib/api'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { formatIST } from '@/lib/datetime'
import { User } from '@/types/models'
import { IconSearch } from '@/components/ui/icons'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [resendResult, setResendResult] = useState<{ id: string; ok: boolean; message: string } | null>(null)

  useEffect(() => {
    api
      .get<(User & { _id: string })[]>('/api/admin/users/getall')
      .then(({ obj }) => setUsers(withIds(obj)))
      .finally(() => setLoading(false))
  }, [])

  async function handleResendActivation(id: string) {
    setResendingId(id)
    setResendResult(null)
    try {
      const { message } = await api.post(`/api/admin/users/${id}/resend-activation`)
      setResendResult({ id, ok: true, message })
    } catch (e) {
      setResendResult({ id, ok: false, message: e instanceof ApiError ? e.message : 'Failed to resend. Try again.' })
    } finally {
      setResendingId(null)
    }
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.mobile.includes(q))
    : users

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Users</h1>

      <div className="relative mt-5 max-w-sm">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or mobile…"
          className="w-full rounded-full border-2 border-cream-deep bg-cream-soft py-2.5 pl-11 pr-4 text-sm text-ink outline-none transition-colors focus:border-green"
        />
      </div>

      <div className="mt-5 overflow-x-auto rounded-3xl border border-cream-deep bg-cream-soft">
        {loading ? (
          <div className="p-6">
            <Skeleton className="h-40" />
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-cream-deep text-left text-xs font-bold uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Addresses</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-deep">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 font-semibold text-ink">
                      {u.name}
                      {u.is_admin && <Badge tone="gold">Admin</Badge>}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    <div>{u.email}</div>
                    <div className="text-xs">{u.mobile || '—'}</div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={u.auth_provider === 'google' ? 'gold' : 'neutral'}>{u.auth_provider}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{u.addresses?.length ?? 0}</td>
                  <td className="px-5 py-3 text-ink-soft">{formatIST(u.created_at, 'DD MMM YYYY')}</td>
                  <td className="px-5 py-3">
                    {u.auth_provider === 'credentials' && !u.is_active && (
                      <div className="flex flex-col items-start gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          loading={resendingId === u.id}
                          onClick={() => handleResendActivation(u.id)}
                        >
                          Resend Activation
                        </Button>
                        {resendResult?.id === u.id && (
                          <span className={`text-xs ${resendResult.ok ? 'text-green-dark' : 'text-red'}`}>
                            {resendResult.message}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && <p className="py-10 text-center text-sm text-ink-soft">No users found.</p>}
      </div>
    </div>
  )
}
