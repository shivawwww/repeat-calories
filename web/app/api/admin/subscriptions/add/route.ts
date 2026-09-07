import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { normalizeSubscription } from '@/lib/subscriptionValidation'
import { buildSubscriptionOrders } from '@/lib/subscription'
import { OrderDoc, SubscriptionDoc, UserDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  if (!body?.user_id) return fail('user_id is required', 400)

  const normalized = normalizeSubscription(body)
  if (normalized instanceof NextResponse) return normalized

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ _id: body.user_id })
  if (!user) return fail('Customer not found', 404)

  const now = nowIST()
  const sub: SubscriptionDoc = {
    _id: uuidv4(),
    user_id: user._id,
    user_snapshot: { name: user.name, mobile: user.mobile },
    ...normalized,
    status: 'active',
    generated_count: 0,
    total_amount: 0,
    created_at: now,
    updated_at: now,
  }

  const orders = await buildSubscriptionOrders(db, sub)
  if (orders.length) await db.collection<OrderDoc>('orders').insertMany(orders)

  sub.generated_count = orders.length
  sub.total_amount = orders.reduce((s, o) => s + o.total_amount, 0)

  await db.collection<SubscriptionDoc>('subscriptions').insertOne(sub)
  return success('Subscription created', sub, { status: 201 })
}
