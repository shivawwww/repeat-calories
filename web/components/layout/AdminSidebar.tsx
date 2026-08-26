'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { IconChart, IconGrid, IconLogout, IconMenu, IconReceipt, IconUsers } from '@/components/ui/icons'
import Logo from '@/components/ui/Logo'

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: IconGrid },
  { href: '/admin/orders', label: 'Orders', icon: IconReceipt },
  { href: '/admin/menu', label: 'Menu', icon: IconMenu },
  { href: '/admin/users', label: 'Users', icon: IconUsers },
  { href: '/admin/analytics', label: 'Analytics', icon: IconChart },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col bg-green-dark px-4 py-6 sm:flex">
        <Link href="/admin/dashboard" className="flex items-center gap-2 px-2">
          <Logo href={null} height={34} />
          <span className="font-display text-sm font-bold uppercase tracking-wide text-cream-soft">Admin</span>
        </Link>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                  active ? 'bg-cream-soft text-green-dark' : 'text-cream-soft/80 hover:bg-white/10'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={() => logout()}
          className="mt-4 flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-cream-soft/70 transition-all active:scale-95 hover:bg-white/10"
        >
          <IconLogout className="h-5 w-5" /> Sign Out
        </button>
      </aside>

      <nav className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto bg-green-dark px-3 py-2.5 sm:hidden" style={{ scrollbarWidth: 'none' }}>
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all active:scale-90 ${
                active ? 'bg-cream-soft text-green-dark' : 'text-cream-soft/80'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
        <button onClick={() => logout()} className="ml-1 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-cream-soft/70 transition-transform active:scale-90">
          <IconLogout className="h-4 w-4" />
        </button>
      </nav>
    </>
  )
}
