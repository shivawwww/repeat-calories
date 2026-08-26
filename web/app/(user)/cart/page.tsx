'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import Button from '@/components/ui/Button'
import { IconPlus, IconMinus, IconTrash, IconCart } from '@/components/ui/icons'

const MIN_ORDER_AMOUNT = 199
const DELIVERY_CHARGE = 40
const FREE_DELIVERY_ABOVE = 499

export default function CartPage() {
  const router = useRouter()
  const { items, total_amount, loading, updateQty, removeItem } = useCart()

  const delivery = total_amount >= FREE_DELIVERY_ABOVE || total_amount === 0 ? 0 : DELIVERY_CHARGE
  const grandTotal = total_amount + delivery
  const belowMinimum = total_amount > 0 && total_amount < MIN_ORDER_AMOUNT

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream-deep/50 text-green">
          <IconCart className="h-9 w-9" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink">Your cart is empty</h1>
        <p className="mt-1.5 max-w-xs text-sm text-ink-soft">Browse the menu and add a few macro-balanced meals to get started.</p>
        <Link href="/menu">
          <Button className="mt-6">Browse Menu</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="pb-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Your Cart</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.menu_item_id} className="flex items-center gap-4 rounded-3xl border border-cream-deep bg-cream-soft p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream-deep/40">
                <Image src={item.image_url || '/meals/placeholder.jpg'} alt={item.name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-ink">{item.name}</p>
                <p className="mt-0.5 text-sm font-bold text-orange-dark">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-green-soft px-1 py-1">
                <button
                  onClick={() => updateQty(item.menu_item_id, item.quantity - 1)}
                  aria-label="Decrease quantity"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-soft text-green-dark shadow-sm transition-transform active:scale-90"
                >
                  <IconMinus className="h-3.5 w-3.5" />
                </button>
                <span className="w-4 text-center text-sm font-bold text-green-dark">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.menu_item_id, item.quantity + 1)}
                  aria-label="Increase quantity"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-soft text-green-dark shadow-sm transition-transform active:scale-90"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={() => removeItem(item.menu_item_id)}
                aria-label="Remove item"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-all active:scale-90 hover:bg-red-soft hover:text-red"
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-3xl border border-cream-deep bg-cream-soft p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Order Summary</h2>
          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span className="stat-figure font-semibold text-ink">₹{total_amount}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Delivery</span>
              <span className="stat-figure font-semibold text-ink">{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
            </div>
            {delivery > 0 && (
              <p className="text-xs text-ink-soft">Add ₹{FREE_DELIVERY_ABOVE - total_amount} more for free delivery.</p>
            )}
            <div className="mt-1 flex justify-between border-t border-cream-deep pt-3 font-display text-base font-bold text-ink">
              <span>Total</span>
              <span className="stat-figure">₹{grandTotal}</span>
            </div>
          </div>

          {belowMinimum && (
            <p className="mt-3 rounded-2xl bg-orange-soft px-3 py-2.5 text-xs font-medium text-orange-dark">
              Minimum order is ₹{MIN_ORDER_AMOUNT}. Add ₹{MIN_ORDER_AMOUNT - total_amount} more to check out.
            </p>
          )}

          <Button
            full
            className="mt-5"
            disabled={belowMinimum || items.length === 0}
            onClick={() => router.push('/checkout')}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}
