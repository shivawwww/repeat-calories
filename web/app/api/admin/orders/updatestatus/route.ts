import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { notifyCustomerOfStatusChange } from '@/lib/notify'
import { OrderStatus } from '@/types/models'
import { OrderDoc } from '@/types/db'

const VALID_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'payment_failed',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
]

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const { order_id, status } = body ?? {}
  if (!order_id || !status) return fail('order_id and status are required', 400)
  if (!VALID_STATUSES.includes(status)) return fail('Invalid status value', 400)

  const db = await getDb()
  const order = await db.collection<OrderDoc>('orders').findOne({ _id: order_id })
  if (!order) return fail('Order not found', 404)

  await db.collection<OrderDoc>('orders').updateOne({ _id: order_id }, { $set: { status, updated_at: nowIST() } })

  await notifyCustomerOfStatusChange(db, order.user_id, order.order_number, status)

  return success('Order status updated', { order_id, status })
}
