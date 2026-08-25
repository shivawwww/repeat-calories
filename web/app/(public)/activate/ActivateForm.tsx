'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api, ApiError } from '@/lib/api'

export default function ActivateForm({ token, initialEmail }: { token: string | null; initialEmail: string }) {
  const router = useRouter()
  const [tempPassword, setTempPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  const [email, setEmail] = useState(initialEmail)
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    setResending(true)
    try {
      await api.post('/api/auth/resend-activation', { email })
      setResent(true)
    } finally {
      setResending(false)
    }
  }

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
      const { obj } = await api.post<{ email: string }>('/api/auth/activate', {
        token,
        temp_password: tempPassword,
        new_password: newPassword,
      })
      setSubmitting(false)
      setSigningIn(true)
      const result = await signIn('credentials', { redirect: false, email: obj.email, password: newPassword })
      setSigningIn(false)
      if (result?.error) {
        router.push('/login')
        return
      }
      router.push('/menu')
      router.refresh()
    } catch (e) {
      setSubmitting(false)
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
    }
  }

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Activation link needed</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Enter the email you signed up with and we&apos;ll send a fresh activation link.
        </p>
        <form onSubmit={handleResend} className="mt-6 flex flex-col gap-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" full loading={resending} disabled={resent}>
            {resent ? 'Email sent — check your inbox' : 'Send activation link'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/login" className="font-semibold text-green hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Activate your account</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Enter the temporary password we emailed you, then set the password you&apos;ll use going forward.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label="Temporary password"
          type="password"
          autoComplete="one-time-code"
          required
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
        />
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

        <Button type="submit" full loading={submitting || signingIn}>
          {signingIn ? 'Signing you in…' : 'Activate & Continue'}
        </Button>
      </form>
    </div>
  )
}
