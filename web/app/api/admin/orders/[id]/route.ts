import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { OrderDoc } from '@/types/db'

// Delete a hand-logged order (wrong entry, cancelled subscription day).
// Website (Razorpay/COD) orders are never deletable here.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const db = await getDb()
  const order = await db.collection<OrderDoc>('orders').findOne({ _id: id })
  if (!order) return fail('Order not found', 404)
  if (order.source !== 'manual') return fail('Website orders cannot be deleted', 400)

  await db.collection<OrderDoc>('orders').deleteOne({ _id: id })
  return success('Order deleted', { id })
}
