import Link from 'next/link'
import Button from '@/components/ui/Button'

export const metadata = { title: 'Payment Failed — Repeat Calories' }

export default async function CheckoutFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-soft text-4xl">😕</div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Payment didn&apos;t go through</h1>
      {order && <p className="mt-2 text-sm text-ink-soft">Reference: {order}</p>}
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
        No amount was deducted, or it will be auto-refunded within a few days. Your cart is still saved — try again
        whenever you&apos;re ready.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/checkout">
          <Button>Try Again</Button>
        </Link>
        <Link href="/cart">
          <Button variant="outline">Back to Cart</Button>
        </Link>
      </div>
    </div>
  )
}
