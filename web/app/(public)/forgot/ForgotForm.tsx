'use client'

import { useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'

export default function ForgotForm() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/api/auth/forgotpassword', { email })
    } finally {
      setSubmitting(false)
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-soft text-3xl">
          📬
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          If an account exists for <span className="font-semibold text-ink">{email}</span>, a password reset link is on
          its way.
        </p>
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
      <h1 className="font-display text-2xl font-semibold text-ink">Forgot your password?</h1>
      <p className="mt-1 text-sm text-ink-soft">Enter your email and we&apos;ll send you a reset link.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" full loading={submitting}>
          Send reset link
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
