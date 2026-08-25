'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api, ApiError } from '@/lib/api'

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/auth/reset-password', { token, new_password: newPassword })
      setDone(true)
      setTimeout(() => router.push('/login'), 1800)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Invalid link</h1>
        <p className="mt-2 text-sm text-ink-soft">This reset link is missing its token. Please request a new one.</p>
        <Link href="/forgot" className="mt-6 inline-block font-semibold text-green hover:underline">
          Request a new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-soft text-3xl">
          ✅
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">Password reset</h1>
        <p className="mt-2 text-sm text-ink-soft">Taking you to sign in…</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Set a new password</h1>
      <p className="mt-1 text-sm text-ink-soft">Make it something you&apos;ll remember.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <div className="rounded-2xl bg-red-soft px-4 py-3 text-sm text-red">{error}</div>}
        <Button type="submit" full loading={submitting}>
          Reset Password
        </Button>
      </form>
    </div>
  )
}
