import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { buildManualOrder } from '@/lib/manualOrder'
import { isValidDate, parseAmount, MEAL_TYPES, MEAL_VARIANTS } from '@/lib/adminValidation'
import { OrderDoc, UserDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const { user_id, date, meal_type, meal_variant, amount, quantity, paid, notes } = body ?? {}

  if (!user_id) return fail('user_id is required', 400)
  if (!isValidDate(date)) return fail('A valid date (YYYY-MM-DD) is required', 400)
  if (!MEAL_TYPES.includes(meal_type)) return fail('meal_type must be lunch or dinner', 400)
  if (!MEAL_VARIANTS.includes(meal_variant)) return fail('Invalid meal_variant', 400)
  const amt = parseAmount(amount)
  if (amt === null || amt <= 0) return fail('A positive amount is required', 400)
  const qty = quantity === undefined ? 1 : Number(quantity)
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) return fail('quantity must be 1-99', 400)

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ _id: user_id })
  if (!user) return fail('Customer not found', 404)

  const order = await buildManualOrder(db, {
    user,
    date,
    meal_type,
    meal_variant,
    amount: amt,
    quantity: qty,
    paid: !!paid,
    notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
  })

  await db.collection<OrderDoc>('orders').insertOne(order)
  return success('Order logged', order, { status: 201 })
}
