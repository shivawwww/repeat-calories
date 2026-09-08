import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { OrderDoc, SubscriptionDoc } from '@/types/db'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const db = await getDb()
  const subs = await db
    .collection<SubscriptionDoc>('subscriptions')
    .find({})
    .sort({ created_at: -1 })
    .toArray()

  // Live rollup of each subscription's generated orders: money paid vs owed,
  // and meals delivered / skipped / still to go (from the daily delivery_state).
  const ids = subs.map((s) => s._id)
  const rows = ids.length
    ? await db
        .collection<OrderDoc>('orders')
        .aggregate<{
          _id: string
          meals_total: number
          meals_delivered: number
          meals_skipped: number
          amount_paid: number
          amount_unpaid: number
          meals_paid: number
          meals_unpaid: number
          days: string[]
          delivered_days: (string | null)[]
        }>([
          { $match: { subscription_id: { $in: ids } } },
          {
            $group: {
              _id: '$subscription_id',
              meals_total: { $sum: 1 },
              meals_delivered: { $sum: { $cond: [{ $eq: ['$delivery_state', 'delivered'] }, 1, 0] } },
              meals_skipped: { $sum: { $cond: [{ $eq: ['$delivery_state', 'skipped'] }, 1, 0] } },
              amount_paid: { $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, '$total_amount', 0] } },
              amount_unpaid: { $sum: { $cond: [{ $ne: ['$payment_status', 'paid'] }, '$total_amount', 0] } },
              meals_paid: { $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, 1, 0] } },
              meals_unpaid: { $sum: { $cond: [{ $ne: ['$payment_status', 'paid'] }, 1, 0] } },
              days: { $addToSet: { $substrCP: ['$created_at', 0, 10] } },
              delivered_days: {
                $addToSet: {
                  $cond: [{ $eq: ['$delivery_state', 'delivered'] }, { $substrCP: ['$created_at', 0, 10] }, null],
                },
              },
            },
          },
        ])
        .toArray()
    : []

  const byId = new Map(rows.map((r) => [r._id, r]))
  const withStats = subs.map((s) => {
    const r = byId.get(s._id)
    const meals_total = r?.meals_total ?? 0
    const meals_delivered = r?.meals_delivered ?? 0
    const meals_skipped = r?.meals_skipped ?? 0
    return {
      ...s,
      stats: {
        meals_total,
        meals_delivered,
        meals_skipped,
        meals_remaining: Math.max(0, meals_total - meals_delivered - meals_skipped),
        days_total: r?.days.length ?? 0,
        days_delivered: r?.delivered_days.filter((d): d is string => d !== null).length ?? 0,
        amount_paid: r?.amount_paid ?? 0,
        amount_unpaid: r?.amount_unpaid ?? 0,
        meals_paid: r?.meals_paid ?? 0,
        meals_unpaid: r?.meals_unpaid ?? 0,
      },
    }
  })

  return success('Subscriptions fetched', withStats, { count: withStats.length })
}
