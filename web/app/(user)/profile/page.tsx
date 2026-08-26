'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, withId, ApiError } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import { IconChevronRight, IconLock, IconLogout, IconMapPin } from '@/components/ui/icons'
import { User } from '@/types/models'

export default function ProfilePage() {
  const { logout } = useAuth()
  const { show } = useToast()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    api
      .get<User & { _id: string }>('/api/auth/me')
      .then(({ obj }) => setProfile(withId(obj)))
      .finally(() => setLoading(false))
  }, [])

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      show('New password and confirmation do not match', 'error')
      return
    }
    setUpdating(true)
    try {
      await api.post('/api/auth/updatepassword', { current_password: currentPassword, new_password: newPassword })
      show('Password updated', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordModalOpen(false)
    } catch (e) {
      show(e instanceof ApiError ? e.message : 'Could not update password', 'error')
    } finally {
      setUpdating(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="mx-auto max-w-xl pb-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Profile</h1>

      <div className="mt-6 flex items-center gap-4 rounded-3xl border border-cream-deep bg-cream-soft p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange text-xl font-bold text-cream-soft">
          {initials || '🙂'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold text-ink">{profile.name}</p>
          <p className="truncate text-sm text-ink-soft">{profile.email}</p>
          {profile.mobile && <p className="text-sm text-ink-soft">{profile.mobile}</p>}
        </div>
        <Badge tone={profile.auth_provider === 'google' ? 'gold' : 'green'}>
          {profile.auth_provider === 'google' ? 'Google' : 'Password'}
        </Badge>
      </div>

      <Link
        href="/profile/addresses"
        className="mt-4 flex items-center justify-between rounded-3xl border border-cream-deep bg-cream-soft p-5 transition-colors active:scale-[0.99] hover:bg-cream-deep/30"
      >
        <span className="flex items-center gap-3 text-sm font-semibold text-ink">
          <IconMapPin className="h-5 w-5 text-green" /> Manage Addresses
        </span>
        <IconChevronRight className="h-5 w-5 text-ink-soft" />
      </Link>

      {profile.auth_provider === 'credentials' && (
        <button
          onClick={() => setPasswordModalOpen(true)}
          className="mt-4 flex w-full items-center justify-between rounded-3xl border border-cream-deep bg-cream-soft p-5 transition-colors active:scale-[0.99] hover:bg-cream-deep/30"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-ink">
            <IconLock className="h-5 w-5 text-green" /> Change Password
          </span>
          <IconChevronRight className="h-5 w-5 text-ink-soft" />
        </button>
      )}

      <Modal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title="Change Password">
        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
          <Input
            label="Current password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            required
            hint="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" loading={updating} full>
            Update Password
          </Button>
        </form>
      </Modal>

      <Button variant="ghost" full className="mt-6 text-red" onClick={() => logout()}>
        <IconLogout className="h-4 w-4" /> Sign Out
      </Button>
    </div>
  )
}
