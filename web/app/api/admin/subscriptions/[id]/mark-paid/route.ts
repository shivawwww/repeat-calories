import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { OrderDoc, SubscriptionDoc } from '@/types/db'

// POST /api/admin/subscriptions/:id/mark-paid  { paid: boolean }
// Marks every generated order for this subscription paid / unpaid in one go.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || typeof body.paid !== 'boolean') return fail('paid (boolean) is required', 400)

  const db = await getDb()
  const sub = await db.collection<SubscriptionDoc>('subscriptions').findOne({ _id: id })
  if (!sub) return fail('Subscription not found', 404)

  const now = nowIST()
  const res = body.paid
    ? await db
        .collection<OrderDoc>('orders')
        .updateMany({ subscription_id: id }, { $set: { payment_status: 'paid', paid_at: now, updated_at: now } })
    : await db
        .collection<OrderDoc>('orders')
        .updateMany({ subscription_id: id }, { $set: { payment_status: 'pending', updated_at: now }, $unset: { paid_at: '' } })

  return success(`Subscription orders marked ${body.paid ? 'paid' : 'unpaid'}`, { id, modified: res.modifiedCount })
}
