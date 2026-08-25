import Link from 'next/link'
import Button from '@/components/ui/Button'

export const metadata = { title: 'Order Confirmed — Repeat Calories' }

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-soft text-4xl">🎉</div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Order Confirmed!</h1>
      {order && (
        <p className="mt-2 font-display text-lg font-semibold text-orange-dark">{order}</p>
      )}
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
        We&apos;re firing up the kitchen. You&apos;ll get a push notification the moment your order is confirmed,
        preparing, and on its way.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {order ? (
          <Link href={`/orders/${order}`}>
            <Button>View Order</Button>
          </Link>
        ) : (
          <Link href="/orders">
            <Button>View Orders</Button>
          </Link>
        )}
        <Link href="/menu">
          <Button variant="outline">Back to Menu</Button>
        </Link>
      </div>
    </div>
  )
}
