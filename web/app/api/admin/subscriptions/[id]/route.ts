import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { normalizeSubscription } from '@/lib/subscriptionValidation'
import { regenerateSubscriptionOrders } from '@/lib/subscription'
import { OrderDoc, SubscriptionDoc, SubscriptionStatus } from '@/types/db'

const STATUSES: SubscriptionStatus[] = ['active', 'paused', 'ended']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return fail('Body required', 400)

  const db = await getDb()
  const sub = await db.collection<SubscriptionDoc>('subscriptions').findOne({ _id: id })
  if (!sub) return fail('Subscription not found', 404)

  // Status-only change (pause / resume / end) — no regeneration.
  if (Object.keys(body).length === 1 && body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return fail('Invalid status', 400)
    await db.collection<SubscriptionDoc>('subscriptions').updateOne(
      { _id: id },
      { $set: { status: body.status, updated_at: nowIST() } }
    )
    return success('Subscription updated', { id, status: body.status })
  }

  // Full edit — revalidate and regenerate the unpaid orders.
  const normalized = normalizeSubscription({ ...sub, ...body } as Record<string, unknown>)
  if (normalized instanceof NextResponse) return normalized

  const updated: SubscriptionDoc = { ...sub, ...normalized, updated_at: nowIST() }
  const counts = await regenerateSubscriptionOrders(db, updated)
  updated.generated_count = counts.generated_count
  updated.total_amount = counts.total_amount

  const { _id, ...rest } = updated
  await db.collection<SubscriptionDoc>('subscriptions').updateOne({ _id }, { $set: rest })
  return success('Subscription updated', updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const db = await getDb()
  const sub = await db.collection<SubscriptionDoc>('subscriptions').findOne({ _id: id })
  if (!sub) return fail('Subscription not found', 404)

  // Unpaid generated orders go with it; paid ones are kept as revenue history.
  const del = await db
    .collection<OrderDoc>('orders')
    .deleteMany({ subscription_id: id, payment_status: { $ne: 'paid' } })
  await db.collection<SubscriptionDoc>('subscriptions').deleteOne({ _id: id })

  return success('Subscription deleted', { id, removed_orders: del.deletedCount })
}
