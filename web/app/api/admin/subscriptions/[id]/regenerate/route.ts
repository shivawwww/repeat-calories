import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { regenerateSubscriptionOrders } from '@/lib/subscription'
import { SubscriptionDoc } from '@/types/db'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const db = await getDb()
  const sub = await db.collection<SubscriptionDoc>('subscriptions').findOne({ _id: id })
  if (!sub) return fail('Subscription not found', 404)

  const counts = await regenerateSubscriptionOrders(db, sub)
  await db.collection<SubscriptionDoc>('subscriptions').updateOne(
    { _id: id },
    { $set: { ...counts, updated_at: nowIST() } }
  )

  return success('Subscription orders regenerated', { id, ...counts })
}
