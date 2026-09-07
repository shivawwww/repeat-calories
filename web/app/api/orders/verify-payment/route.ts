import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { verifyPaymentSignature } from '@/lib/razorpay'
import { nowIST } from '@/lib/datetime'
import { notifyAdminOfNewOrder } from '@/lib/notify'
import { OrderDoc, CartDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {}
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return fail('razorpay_order_id, razorpay_payment_id and razorpay_signature are required', 400)
  }

  const db = await getDb()
  const order = await db
    .collection<OrderDoc>('orders')
    .findOne({ 'razorpay.razorpay_order_id': razorpay_order_id, user_id: currentUser.userId })
  if (!order) return fail('Order not found', 404)

  const valid = verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
  if (!valid) {
    await db.collection<OrderDoc>('orders').updateOne(
      { _id: order._id },
      { $set: { status: 'payment_failed', payment_status: 'failed', updated_at: nowIST() } }
    )
    return fail('Payment signature verification failed', 400)
  }

  const now = nowIST()
  await db.collection<OrderDoc>('orders').updateOne(
    { _id: order._id },
    {
      $set: {
        status: 'confirmed',
        payment_status: 'paid',
        paid_at: now,
        'razorpay.razorpay_payment_id': razorpay_payment_id,
        'razorpay.razorpay_signature': razorpay_signature,
        'razorpay.payment_captured_at': now,
        updated_at: now,
      },
    }
  )

  await db.collection<CartDoc>('carts').updateOne(
    { user_id: currentUser.userId },
    { $set: { items: [], total_amount: 0, updated_at: now } }
  )

  await notifyAdminOfNewOrder(db, order.order_number, order.total_amount)

  return success('Payment verified', { order_number: order.order_number })
}
