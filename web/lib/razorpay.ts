import Razorpay from 'razorpay'
import { createHmac } from 'crypto'

export function getRazorpayClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export function verifyPaymentSignature(params: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): boolean {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params
  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  return expected === razorpay_signature
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!).update(rawBody).digest('hex')
  return expected === signature
}
