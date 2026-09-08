import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { eachDeliveryDay, nextDeliveryDays, nowIST } from '@/lib/datetime'
import { buildOrdersForDates } from '@/lib/subscription'
import { OrderDoc, SubscriptionDoc } from '@/types/db'

// POST /api/admin/subscriptions/:id/add-days  { count: number }
// Append make-up delivery days after the current end date — e.g. because a
// meal was skipped and the customer is owed another day.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const body = await req.json().catch(() => null)
  const count = Number(body?.count)
  if (!Number.isInteger(count) || count < 1 || count > 60) return fail('count must be 1-60', 400)

  const db = await getDb()
  const sub = await db.collection<SubscriptionDoc>('subscriptions').findOne({ _id: id })
  if (!sub) return fail('Subscription not found', 404)

  const existingCount = eachDeliveryDay(sub.start_date, sub.end_date, sub.delivery_days).length
  const newDates = nextDeliveryDays(sub.end_date, sub.delivery_days, count)
  if (newDates.length === 0) return fail('No delivery days available to add', 400)

  const orders = await buildOrdersForDates(db, sub, newDates, existingCount)
  if (orders.length) await db.collection<OrderDoc>('orders').insertMany(orders)

  const now = nowIST()
  const added_amount = orders.reduce((s, o) => s + o.total_amount, 0)
  await db.collection<SubscriptionDoc>('subscriptions').updateOne(
    { _id: id },
    {
      $set: {
        end_date: newDates[newDates.length - 1],
        generated_count: sub.generated_count + orders.length,
        total_amount: sub.total_amount + added_amount,
        updated_at: now,
      },
    }
  )

  return success('Make-up days added', {
    id,
    days_added: newDates.length,
    meals_added: orders.length,
    new_end_date: newDates[newDates.length - 1],
  })
}
