import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { nowIST } from '@/lib/datetime'
import { notifyAdminOfNewOrder } from '@/lib/notify'
import { OrderDoc, CartDoc } from '@/types/db'

// Backup handler for cases where the user closes the browser mid-payment —
// the primary confirmation path is /api/orders/verify-payment.
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity
    const razorpay_order_id = payment?.order_id
    const razorpay_payment_id = payment?.id

    if (razorpay_order_id) {
      const db = await getDb()
      const order = await db.collection<OrderDoc>('orders').findOne({ 'razorpay.razorpay_order_id': razorpay_order_id })

      if (order && order.payment_status !== 'paid') {
        const now = nowIST()
        await db.collection<OrderDoc>('orders').updateOne(
          { _id: order._id },
          {
            $set: {
              status: 'confirmed',
              payment_status: 'paid',
              'razorpay.razorpay_payment_id': razorpay_payment_id,
              'razorpay.payment_captured_at': now,
              updated_at: now,
            },
          }
        )
        await db.collection<CartDoc>('carts').updateOne(
          { user_id: order.user_id },
          { $set: { items: [], total_amount: 0, updated_at: now } }
        )
        await notifyAdminOfNewOrder(db, order.order_number, order.total_amount)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
