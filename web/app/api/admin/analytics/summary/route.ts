import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowISTDayjs } from '@/lib/datetime'

const PAID_STATUSES = ['confirmed', 'preparing', 'ready', 'delivered']

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const db = await getDb()
  const todayStart = nowISTDayjs().startOf('day').format('YYYY-MM-DDTHH:mm:ssZ')
  const todayEnd = nowISTDayjs().endOf('day').format('YYYY-MM-DDTHH:mm:ssZ')

  const [revenueResult, ordersToday, pendingCount] = await Promise.all([
    db
      .collection('orders')
      .aggregate([
        { $match: { status: { $in: PAID_STATUSES } } },
        { $group: { _id: null, total_revenue: { $sum: '$total_amount' } } },
      ])
      .toArray(),
    db.collection('orders').countDocuments({ created_at: { $gte: todayStart, $lte: todayEnd } }),
    db.collection('orders').countDocuments({ status: 'pending' }),
  ])

  return success('Analytics summary fetched', {
    total_revenue: revenueResult[0]?.total_revenue ?? 0,
    orders_today: ordersToday,
    pending_count: pendingCount,
  })
}
