import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { istDayRange, todayISTDate } from '@/lib/datetime'
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
  // meals paid vs owed, and days already served vs still upcoming.
  const ids = subs.map((s) => s._id)
  const todayEnd = istDayRange(todayISTDate()).end
  const rows = ids.length
    ? await db
        .collection<OrderDoc>('orders')
        .aggregate<{
          _id: string
          amount_paid: number
          amount_unpaid: number
          meals_paid: number
          meals_unpaid: number
          days: string[]
          given_dates: (string | null)[]
        }>([
          { $match: { subscription_id: { $in: ids } } },
          {
            $group: {
              _id: '$subscription_id',
              amount_paid: { $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, '$total_amount', 0] } },
              amount_unpaid: { $sum: { $cond: [{ $ne: ['$payment_status', 'paid'] }, '$total_amount', 0] } },
              meals_paid: { $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, 1, 0] } },
              meals_unpaid: { $sum: { $cond: [{ $ne: ['$payment_status', 'paid'] }, 1, 0] } },
              days: { $addToSet: { $substrCP: ['$created_at', 0, 10] } },
              given_dates: {
                $addToSet: {
                  $cond: [{ $lte: ['$created_at', todayEnd] }, { $substrCP: ['$created_at', 0, 10] }, null],
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
    const days_total = r?.days.length ?? 0
    const days_given = r?.given_dates.filter((d): d is string => d !== null).length ?? 0
    return {
      ...s,
      stats: {
        days_total,
        days_given,
        days_pending: Math.max(0, days_total - days_given),
        amount_paid: r?.amount_paid ?? 0,
        amount_unpaid: r?.amount_unpaid ?? 0,
        meals_paid: r?.meals_paid ?? 0,
        meals_unpaid: r?.meals_unpaid ?? 0,
      },
    }
  })

  return success('Subscriptions fetched', withStats, { count: withStats.length })
}
