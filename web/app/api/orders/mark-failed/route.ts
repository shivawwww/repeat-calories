import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { OrderDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const razorpay_order_id = body?.razorpay_order_id
  if (!razorpay_order_id) return fail('razorpay_order_id is required', 400)

  const db = await getDb()
  const result = await db.collection<OrderDoc>('orders').updateOne(
    { 'razorpay.razorpay_order_id': razorpay_order_id, user_id: currentUser.userId },
    { $set: { status: 'payment_failed', payment_status: 'failed', updated_at: nowIST() } }
  )

  if (result.matchedCount === 0) return fail('Order not found', 404)

  return success('Order marked as payment failed', { razorpay_order_id })
}
