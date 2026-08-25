'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { IconCart, IconLogout } from '@/components/ui/icons'
import Logo from '@/components/ui/Logo'

const LINKS = [
  { href: '/menu', label: 'Menu' },
  { href: '/orders', label: 'Orders' },
  { href: '/profile', label: 'Profile' },
]

export default function UserTopNav() {
  const pathname = usePathname()
  const { count } = useCart()
  const { logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-cream-deep/70 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <Logo size={64} />

        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + '/')
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
                  active ? 'bg-green-soft text-green-dark' : 'text-ink-soft hover:bg-cream-deep/50'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-deep/50"
          >
            <IconCart />
            {count > 0 && (
              <span
                key={count}
                className="animate-bounce-badge absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-cream-soft"
              >
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => logout()}
            aria-label="Sign out"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream-deep/50 sm:flex"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </header>
  )
}
