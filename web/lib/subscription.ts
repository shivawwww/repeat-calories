import { Db } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { generateOrderNumber } from '@/lib/orderNumber'
import { eachDeliveryDay, istDateAtNoon, nowIST } from '@/lib/datetime'
import {
  MealType,
  MealVariant,
  OrderDoc,
  SubscriptionDoc,
  UserDoc,
} from '@/types/db'

const TITLE: Record<MealType, string> = { lunch: 'Lunch', dinner: 'Dinner' }
const VARIANT_LABEL: Record<MealVariant, string> = {
  normal: 'Normal',
  salad: 'Salad',
  wrap: 'Wrap',
  custom: 'Custom',
}

export function mealLabel(meal: MealType, variant: MealVariant): string {
  return `${TITLE[meal]} — ${VARIANT_LABEL[variant]}`
}

// The meals a subscription delivers on the Nth delivery day (0-based index).
function mealsForDay(sub: SubscriptionInput, dayIndex: number): { meal_type: MealType; meal_variant: MealVariant; amount: number }[] {
  const rotate = (meal: MealType): MealVariant => {
    if (!sub.rotation_enabled || sub.plan !== 'lunch_dinner' || sub.rotation_applies_to !== meal) {
      return 'normal'
    }
    const other = sub.rotation_start_with === 'salad' ? 'wrap' : 'salad'
    return dayIndex % 2 === 0 ? sub.rotation_start_with : other
  }

  const meals: { meal_type: MealType; meal_variant: MealVariant; amount: number }[] = []
  if (sub.plan === 'lunch' || sub.plan === 'lunch_dinner') {
    meals.push({ meal_type: 'lunch', meal_variant: rotate('lunch'), amount: sub.lunch_price ?? 0 })
  }
  if (sub.plan === 'dinner' || sub.plan === 'lunch_dinner') {
    meals.push({ meal_type: 'dinner', meal_variant: rotate('dinner'), amount: sub.dinner_price ?? 0 })
  }
  return meals
}

export interface SubscriptionInput {
  plan: SubscriptionDoc['plan']
  start_date: string
  end_date: string
  delivery_days: number[]
  lunch_price?: number
  dinner_price?: number
  rotation_enabled: boolean
  rotation_applies_to: MealType
  rotation_start_with: 'salad' | 'wrap'
}

// Pure calculation for the create/edit form — no DB. Returns the total order
// count, the summed amount, and the first few days broken out for a preview.
export function previewSubscription(sub: SubscriptionInput): {
  count: number
  total: number
  sampleDays: { date: string; meals: { meal_type: MealType; meal_variant: MealVariant; amount: number }[] }[]
} {
  const days = eachDeliveryDay(sub.start_date, sub.end_date, sub.delivery_days)
  let count = 0
  let total = 0
  const sampleDays = days.map((date, i) => {
    const meals = mealsForDay(sub, i)
    count += meals.length
    total += meals.reduce((s, m) => s + m.amount, 0)
    return { date, meals }
  })
  return { count, total, sampleDays: sampleDays.slice(0, 6) }
}

// Materialise a subscription into individual `orders` documents, one per meal per
// delivery day. Each is a manual order the admin marks paid as money comes in.
export async function buildSubscriptionOrders(db: Db, sub: SubscriptionDoc): Promise<OrderDoc[]> {
  const user = await db.collection<UserDoc>('users').findOne({ _id: sub.user_id })
  const addr = user?.addresses?.find((a) => a.is_default) ?? user?.addresses?.[0]
  const delivery_address = {
    address_id: addr?.address_id ?? '',
    label: addr?.label ?? '',
    full_address: addr?.full_address ?? '',
    area: addr?.area ?? '',
    city: addr?.city ?? 'Coimbatore',
    pincode: addr?.pincode ?? '',
    landmark: addr?.landmark,
    lat: addr?.lat,
    lng: addr?.lng,
  }

  const days = eachDeliveryDay(sub.start_date, sub.end_date, sub.delivery_days)
  const now = nowIST()
  const orders: OrderDoc[] = []

  for (let i = 0; i < days.length; i++) {
    const date = days[i]
    for (const meal of mealsForDay(sub, i)) {
      const name = mealLabel(meal.meal_type, meal.meal_variant)
      orders.push({
        _id: uuidv4(),
        order_number: await generateOrderNumber(db, 'subscription'),
        user_id: sub.user_id,
        user_snapshot: { name: sub.user_snapshot.name, mobile: sub.user_snapshot.mobile, email: user?.email ?? '' },
        delivery_address,
        items: [
          { menu_item_id: '', name, price: meal.amount, quantity: 1, subtotal: meal.amount },
        ],
        subtotal: meal.amount,
        delivery_charge: 0,
        total_amount: meal.amount,
        status: 'confirmed',
        payment_method: 'manual',
        payment_status: 'pending',
        source: 'manual',
        order_kind: 'subscription',
        subscription_id: sub._id,
        meal_type: meal.meal_type,
        meal_variant: meal.meal_variant,
        notes: sub.notes,
        created_at: istDateAtNoon(date),
        updated_at: now,
      })
    }
  }
  return orders
}

// Idempotent (re)generation: keep every order that's already been marked paid,
// drop the rest for this subscription, and insert whatever days are now missing.
export async function regenerateSubscriptionOrders(
  db: Db,
  sub: SubscriptionDoc
): Promise<{ generated_count: number; total_amount: number }> {
  await db
    .collection<OrderDoc>('orders')
    .deleteMany({ subscription_id: sub._id, payment_status: { $ne: 'paid' } })

  const paid = await db
    .collection<OrderDoc>('orders')
    .find({ subscription_id: sub._id, payment_status: 'paid' })
    .toArray()
  const paidKeys = new Set(paid.map((o) => `${o.created_at.slice(0, 10)}|${o.meal_type}`))

  const fresh = (await buildSubscriptionOrders(db, sub)).filter(
    (o) => !paidKeys.has(`${o.created_at.slice(0, 10)}|${o.meal_type}`)
  )
  if (fresh.length) await db.collection<OrderDoc>('orders').insertMany(fresh)

  const all = await db
    .collection<OrderDoc>('orders')
    .find({ subscription_id: sub._id })
    .toArray()
  return {
    generated_count: all.length,
    total_amount: all.reduce((s, o) => s + o.total_amount, 0),
  }
}
