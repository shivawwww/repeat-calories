'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { IconGrid, IconCart, IconReceipt, IconUser } from '@/components/ui/icons'

const ITEMS = [
  { href: '/menu', label: 'Menu', icon: IconGrid },
  { href: '/cart', label: 'Cart', icon: IconCart },
  { href: '/orders', label: 'Orders', icon: IconReceipt },
  { href: '/profile', label: 'Profile', icon: IconUser },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { count } = useCart()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-cream-deep bg-cream-soft/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-0.5 rounded-2xl px-4 py-1.5 transition-colors ${
                active ? 'text-green-dark' : 'text-ink-soft'
              }`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {href === '/cart' && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[9px] font-bold text-cream-soft">
                    {count}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
