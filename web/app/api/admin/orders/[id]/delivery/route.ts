import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { DeliveryState, OrderDoc } from '@/types/db'

const STATES: DeliveryState[] = ['pending', 'delivered', 'skipped']

// PATCH /api/admin/orders/:id/delivery  { state: 'delivered' | 'skipped' | 'pending' }
// The daily "did this meal go out?" toggle. Manual/subscription orders only.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || !STATES.includes(body.state)) return fail('state must be delivered, skipped or pending', 400)

  const db = await getDb()
  const order = await db.collection<OrderDoc>('orders').findOne({ _id: id })
  if (!order) return fail('Order not found', 404)
  if (order.source !== 'manual') return fail('Only manual / subscription orders can be marked', 400)

  const now = nowIST()
  if (body.state === 'pending') {
    await db
      .collection<OrderDoc>('orders')
      .updateOne({ _id: id }, { $set: { updated_at: now }, $unset: { delivery_state: '', delivery_marked_at: '' } })
  } else {
    await db
      .collection<OrderDoc>('orders')
      .updateOne({ _id: id }, { $set: { delivery_state: body.state, delivery_marked_at: now, updated_at: now } })
  }

  return success('Delivery updated', { id, state: body.state })
}
