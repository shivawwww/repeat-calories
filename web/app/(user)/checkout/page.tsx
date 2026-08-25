'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useAddresses } from '@/hooks/useAddresses'
import { useToast } from '@/components/ui/Toast'
import { api, ApiError } from '@/lib/api'
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/loadRazorpay'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import AddressCard from '@/components/address/AddressCard'
import AddressForm, { AddressFormValues } from '@/components/address/AddressForm'
import Skeleton from '@/components/ui/Skeleton'

const MIN_ORDER_AMOUNT = 199
const DELIVERY_CHARGE = 40
const FREE_DELIVERY_ABOVE = 499

interface RazorpayOrderResponse {
  razorpay_order_id: string
  amount: number
  currency: string
  key_id: string
  order_number: string
}

interface CodOrderResponse {
  order_number: string
  total_amount: number
  payment_method: 'cod'
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total_amount, loading: cartLoading, refresh: refreshCart } = useCart()
  const { user } = useAuth()
  const { addresses, loading: addressesLoading, addAddress } = useAddresses()
  const { show } = useToast()

  const [manualSelectedId, setManualSelectedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')
  const [notes, setNotes] = useState('')
  const [placing, setPlacing] = useState(false)

  const selectedId =
    manualSelectedId ?? addresses.find((a) => a.is_default)?.address_id ?? addresses[0]?.address_id ?? null

  useEffect(() => {
    if (!cartLoading && items.length === 0) router.replace('/cart')
  }, [cartLoading, items.length, router])

  const delivery = total_amount >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE
  const grandTotal = total_amount + delivery

  async function handleAddAddress(values: AddressFormValues) {
    setSavingAddress(true)
    try {
      const created = await addAddress(values)
      setManualSelectedId(created.address_id)
      setShowAddModal(false)
    } catch (e) {
      show(e instanceof ApiError ? e.message : 'Could not save address', 'error')
    } finally {
      setSavingAddress(false)
    }
  }

  async function handlePlaceOrder() {
    if (!selectedId) return
    setPlacing(true)
    try {
      if (paymentMethod === 'cod') {
        const { obj } = await api.post<CodOrderResponse>('/api/orders/create-razorpay', {
          address_id: selectedId,
          payment_method: 'cod',
          notes,
        })
        await refreshCart()
        router.push(`/checkout/success?order=${obj.order_number}`)
        return
      }

      const { obj } = await api.post<RazorpayOrderResponse>('/api/orders/create-razorpay', {
        address_id: selectedId,
        payment_method: 'razorpay',
        notes,
      })

      const loaded = await loadRazorpayScript()
      if (!loaded) {
        show('Could not load payment gateway. Please try again.', 'error')
        setPlacing(false)
        return
      }

      openRazorpayCheckout({
        key: obj.key_id,
        amount: obj.amount,
        currency: obj.currency,
        name: 'Repeat Calories',
        description: `Order ${obj.order_number}`,
        order_id: obj.razorpay_order_id,
        prefill: { name: user?.name ?? undefined, email: user?.email ?? undefined },
        theme: { color: '#E87722' },
        handler: async (response) => {
          try {
            await api.post('/api/orders/verify-payment', response)
            await refreshCart()
            router.push(`/checkout/success?order=${obj.order_number}`)
          } catch {
            router.push(`/checkout/failed?order=${obj.order_number}`)
          }
        },
        modal: {
          ondismiss: async () => {
            await api.post('/api/orders/mark-failed', { razorpay_order_id: obj.razorpay_order_id }).catch(() => {})
            setPlacing(false)
          },
        },
      })
    } catch (e) {
      show(e instanceof ApiError ? e.message : 'Could not place order', 'error')
      setPlacing(false)
    }
  }

  if (cartLoading || addressesLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  return (
    <div className="pb-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Delivery Address</h2>
              {addresses.length > 0 && (
                <button onClick={() => setShowAddModal(true)} className="text-xs font-bold uppercase tracking-wide text-green hover:underline">
                  + Add new
                </button>
              )}
            </div>

            {addresses.length === 0 ? (
              <div className="rounded-3xl border border-cream-deep bg-cream-soft p-5">
                <p className="mb-4 text-sm text-ink-soft">Add a delivery address to continue.</p>
                <AddressForm onSubmit={handleAddAddress} submitting={savingAddress} showSetDefault={false} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {addresses.map((a) => (
                  <AddressCard
                    key={a.address_id}
                    address={a}
                    selected={selectedId === a.address_id}
                    onSelect={() => setManualSelectedId(a.address_id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">Payment Method</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod('razorpay')}
                className={`flex-1 rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  paymentMethod === 'razorpay' ? 'border-green bg-green-soft text-green-dark' : 'border-cream-deep text-ink-soft'
                }`}
              >
                💳 Pay Online
                <span className="mt-0.5 block text-xs font-normal opacity-80">UPI, Cards, Netbanking via Razorpay</span>
              </button>
              <button
                onClick={() => setPaymentMethod('cod')}
                className={`flex-1 rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  paymentMethod === 'cod' ? 'border-green bg-green-soft text-green-dark' : 'border-cream-deep text-ink-soft'
                }`}
              >
                💵 Cash on Delivery
                <span className="mt-0.5 block text-xs font-normal opacity-80">Pay when it arrives</span>
              </button>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">Delivery Notes (optional)</h2>
            <Textarea
              rows={2}
              placeholder="E.g. Ring the bell, leave at the door…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>

        <div className="h-fit rounded-3xl border border-cream-deep bg-cream-soft p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Order Summary</h2>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <div key={item.menu_item_id} className="flex justify-between text-ink-soft">
                <span>
                  {item.name} <span className="text-ink-soft/70">×{item.quantity}</span>
                </span>
                <span className="stat-figure font-semibold text-ink">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-cream-deep pt-3 text-ink-soft">
              <span>Subtotal</span>
              <span className="stat-figure font-semibold text-ink">₹{total_amount}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Delivery</span>
              <span className="stat-figure font-semibold text-ink">{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-cream-deep pt-3 font-display text-base font-bold text-ink">
              <span>Total</span>
              <span className="stat-figure">₹{grandTotal}</span>
            </div>
          </div>

          <Button full className="mt-5" disabled={!selectedId || total_amount < MIN_ORDER_AMOUNT} loading={placing} onClick={handlePlaceOrder}>
            {paymentMethod === 'cod' ? 'Place Order' : `Pay ₹${grandTotal}`}
          </Button>
        </div>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Delivery Address">
        <AddressForm onSubmit={handleAddAddress} onCancel={() => setShowAddModal(false)} submitting={savingAddress} />
      </Modal>
    </div>
  )
}
