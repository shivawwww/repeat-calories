'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notActivated, setNotActivated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotActivated(false)
    setSubmitting(true)
    const result = await signIn('credentials', { redirect: false, email, password })
    setSubmitting(false)

    if (!result || result.error) {
      if (result?.error === 'ACCOUNT_NOT_ACTIVATED') {
        setNotActivated(true)
      } else {
        setError('Incorrect email or password. Please try again.')
      }
      return
    }

    // A full navigation (not router.push) so the freshly-set session cookie is
    // guaranteed to be present on the very next request — a client-side router
    // transition right after signIn can race the cookie and bounce back to
    // /login?callbackUrl=... on the first click.
    const session = await getSession()
    const dest = callbackUrl ?? (session?.user?.is_admin ? '/admin/dashboard' : '/menu')
    window.location.href = dest
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-soft">Sign in to keep your streak going.</p>

      <button
        type="button"
        disabled={googleLoading}
        onClick={() => {
          setGoogleLoading(true)
          signIn('google', { callbackUrl: callbackUrl ?? '/menu' })
        }}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border-2 border-cream-deep bg-white px-6 py-3 text-sm font-semibold text-ink transition-all active:scale-[0.98] hover:bg-cream disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.85.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 009 18z" />
          <path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 013.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
        </svg>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-cream-deep" />
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">or</span>
        <div className="h-px flex-1 bg-cream-deep" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {notActivated && (
          <div className="rounded-2xl bg-orange-soft px-4 py-3 text-sm text-orange-dark">
            Your account isn&apos;t activated yet.{' '}
            <Link href={`/activate?email=${encodeURIComponent(email)}`} className="font-semibold underline">
              Activate it now
            </Link>
            .
          </div>
        )}
        {error && <div className="rounded-2xl bg-red-soft px-4 py-3 text-sm text-red">{error}</div>}

        <div className="flex justify-end">
          <Link href="/forgot" className="text-xs font-semibold text-green hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" full loading={submitting}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New to Repeat Calories?{' '}
        <Link href="/signup" className="font-semibold text-green hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
