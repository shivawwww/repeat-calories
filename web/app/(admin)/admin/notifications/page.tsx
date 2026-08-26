'use client'

import { useEffect, useMemo, useState } from 'react'
import { api, withIds, ApiError } from '@/lib/api'
import Button from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { IconSearch } from '@/components/ui/icons'
import { User } from '@/types/models'

type Target = 'all' | 'user'

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [target, setTarget] = useState<Target>('all')
  const [query, setQuery] = useState('')
  const [userId, setUserId] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [link, setLink] = useState('/menu')

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<(User & { _id: string })[]>('/api/admin/users/getall')
      .then(({ obj }) => setUsers(withIds(obj)))
      .finally(() => setLoadingUsers(false))
  }, [])

  const notifiable = useMemo(() => users.filter((u) => (u.fcmTokens?.length ?? 0) > 0), [users])
  const q = query.trim().toLowerCase()
  const filteredUsers = q
    ? notifiable.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    : notifiable

  const selectedUser = notifiable.find((u) => u.id === userId)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (target === 'user' && !userId) {
      setError('Pick a user to notify.')
      return
    }

    setSending(true)
    try {
      const { obj } = await api.post<{ sentCount: number }>('/api/admin/notifications/send', {
        target,
        userId: target === 'user' ? userId : undefined,
        title,
        body,
        link,
      })
      setResult(
        target === 'all'
          ? `Sent to ${obj.sentCount} user${obj.sentCount === 1 ? '' : 's'}.`
          : `Sent to ${selectedUser?.name ?? 'user'}.`
      )
      setTitle('')
      setBody('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold text-ink">Notifications</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Send a push notification to everyone, or to one specific user. Automated lunch/dinner reminders are handled
        separately by the scheduled cron jobs.
      </p>

      <form onSubmit={handleSend} className="mt-6 flex flex-col gap-4">
        <Select label="Send to" value={target} onChange={(e) => setTarget(e.target.value as Target)}>
          <option value="all">All users ({notifiable.length} with a registered device)</option>
          <option value="user">Specific user</option>
        </Select>

        {target === 'user' && (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full rounded-2xl border-2 border-cream-deep bg-cream-soft py-3 pl-11 pr-4 text-sm text-ink outline-none transition-colors focus:border-green"
              />
            </div>

            <div className="max-h-56 overflow-y-auto rounded-2xl border-2 border-cream-deep bg-cream-soft">
              {loadingUsers ? (
                <div className="p-4">
                  <Skeleton className="h-24" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="p-4 text-center text-sm text-ink-soft">
                  {notifiable.length === 0 ? 'No users have a registered device yet.' : 'No matches.'}
                </p>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => setUserId(u.id)}
                    className={`flex w-full items-center justify-between border-b border-cream-deep px-4 py-2.5 text-left text-sm last:border-b-0 transition-colors ${
                      userId === u.id ? 'bg-green-soft' : 'hover:bg-white/60'
                    }`}
                  >
                    <span>
                      <span className="font-semibold text-ink">{u.name}</span>
                      <span className="ml-2 text-xs text-ink-soft">{u.email}</span>
                    </span>
                    {userId === u.id && <Badge tone="green">Selected</Badge>}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <Input
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 🎉 New item on the menu!"
          maxLength={65}
        />
        <Textarea
          label="Message"
          required
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What do you want to tell them?"
          maxLength={180}
        />
        <Input
          label="Link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          hint="Where tapping the notification takes them. Defaults to the menu."
        />

        {error && <div className="rounded-2xl bg-red-soft px-4 py-3 text-sm text-red">{error}</div>}
        {result && <div className="rounded-2xl bg-green-soft px-4 py-3 text-sm text-green-dark">{result}</div>}

        <Button type="submit" full loading={sending}>
          Send Notification
        </Button>
      </form>
    </div>
  )
}
