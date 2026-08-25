'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api, ApiError } from '@/lib/api'

export default function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { obj } = await api.post<{ email: string }>('/api/auth/signup', { name, email, mobile })
      setDone(obj.email)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (!done) return
    setResending(true)
    try {
      await api.post('/api/auth/resend-activation', { email: done })
      setResent(true)
    } finally {
      setResending(false)
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-soft text-3xl">
          📬
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          We&apos;ve sent a temporary password and activation link to <span className="font-semibold text-ink">{done}</span>.
          Open it to set your real password and start ordering.
        </p>
        <Button
          type="button"
          variant="outline"
          full
          className="mt-6"
          loading={resending}
          disabled={resent}
          onClick={handleResend}
        >
          {resent ? 'Email resent' : 'Resend email'}
        </Button>
        <p className="mt-6 text-center text-sm text-ink-soft">
          Already activated?{' '}
          <Link href="/login" className="font-semibold text-green hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink-soft">Just the basics — we&apos;ll email you a temporary password.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Mobile number"
          type="tel"
          required
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        {error && <div className="rounded-2xl bg-red-soft px-4 py-3 text-sm text-red">{error}</div>}

        <Button type="submit" full loading={submitting}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-green hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
