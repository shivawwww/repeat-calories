import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { parseAmount } from '@/lib/adminValidation'
import { OrderDoc } from '@/types/db'

// PATCH /api/admin/orders/:id/payment  { paid: boolean, amount?: number }
// Marks a manually-logged order paid/unpaid and optionally corrects its amount.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || typeof body.paid !== 'boolean') return fail('paid (boolean) is required', 400)

  const db = await getDb()
  const order = await db.collection<OrderDoc>('orders').findOne({ _id: id })
  if (!order) return fail('Order not found', 404)
  if (order.source !== 'manual') return fail('Only manually-logged orders can be updated here', 400)

  const now = nowIST()
  const set: Record<string, unknown> = {
    payment_status: body.paid ? 'paid' : 'pending',
    updated_at: now,
  }

  if (body.amount !== undefined) {
    const amt = parseAmount(body.amount)
    if (amt === null || amt <= 0) return fail('A positive amount is required', 400)
    const name = order.items[0]?.name ?? 'Meal'
    set.total_amount = amt
    set.subtotal = amt
    set.items = [{ menu_item_id: '', name, price: amt, quantity: 1, subtotal: amt }]
  }

  if (body.paid) {
    set.paid_at = now
    await db.collection<OrderDoc>('orders').updateOne({ _id: id }, { $set: set })
  } else {
    await db.collection<OrderDoc>('orders').updateOne({ _id: id }, { $set: set, $unset: { paid_at: '' } })
  }
  return success('Payment updated', { id, paid: body.paid })
}
