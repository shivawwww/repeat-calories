import { CartProvider } from '@/hooks/useCart'
import UserTopNav from '@/components/layout/UserTopNav'
import BottomNav from '@/components/layout/BottomNav'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex h-dvh flex-col overflow-hidden">
        <UserTopNav />
        <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 pb-24 pt-4 sm:px-8 sm:pb-10">{children}</main>
        <BottomNav />
      </div>
    </CartProvider>
  )
}
