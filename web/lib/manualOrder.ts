import { Db } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { generateOrderNumber, OrderNumberKind } from '@/lib/orderNumber'
import { istDateAtNoon, nowIST } from '@/lib/datetime'
import { mealLabel } from '@/lib/subscription'
import { MealType, MealVariant, OrderDoc, UserDoc } from '@/types/db'

export interface ManualOrderInput {
  user: Pick<UserDoc, '_id' | 'name' | 'mobile' | 'email' | 'addresses'>
  date: string // 'YYYY-MM-DD'
  meal_type: MealType
  meal_variant: MealVariant
  amount: number
  paid: boolean
  notes?: string
  numberKind?: Extract<OrderNumberKind, 'manual' | 'legacy'>
}

// One hand-logged order (walk-in or historical import). Mirrors the shape the
// Razorpay flow writes so the admin Orders views render it unchanged.
export async function buildManualOrder(db: Db, input: ManualOrderInput): Promise<OrderDoc> {
  const { user } = input
  const addr = user.addresses?.find((a) => a.is_default) ?? user.addresses?.[0]
  const now = nowIST()
  const name = mealLabel(input.meal_type, input.meal_variant)

  return {
    _id: uuidv4(),
    order_number: await generateOrderNumber(db, input.numberKind ?? 'manual'),
    user_id: user._id,
    user_snapshot: { name: user.name, mobile: user.mobile, email: user.email ?? '' },
    delivery_address: {
      address_id: addr?.address_id ?? '',
      label: addr?.label ?? '',
      full_address: addr?.full_address ?? '',
      area: addr?.area ?? '',
      city: addr?.city ?? 'Coimbatore',
      pincode: addr?.pincode ?? '',
      landmark: addr?.landmark,
      lat: addr?.lat,
      lng: addr?.lng,
    },
    items: [{ menu_item_id: '', name, price: input.amount, quantity: 1, subtotal: input.amount }],
    subtotal: input.amount,
    delivery_charge: 0,
    total_amount: input.amount,
    status: 'confirmed',
    payment_method: 'manual',
    payment_status: input.paid ? 'paid' : 'pending',
    paid_at: input.paid ? istDateAtNoon(input.date) : undefined,
    source: 'manual',
    order_kind: 'one_time',
    meal_type: input.meal_type,
    meal_variant: input.meal_variant,
    notes: input.notes,
    created_at: istDateAtNoon(input.date),
    updated_at: now,
  }
}
