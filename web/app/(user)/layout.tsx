import { CartProvider } from '@/hooks/useCart'
import UserTopNav from '@/components/layout/UserTopNav'
import BottomNav from '@/components/layout/BottomNav'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex flex-1 flex-col">
        <UserTopNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 sm:px-8 sm:pb-10">{children}</main>
        <BottomNav />
      </div>
    </CartProvider>
  )
}
