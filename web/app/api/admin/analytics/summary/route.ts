import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { istDayRange, todayISTDate } from '@/lib/datetime'
import { ExpenseDoc, OrderDoc } from '@/types/db'

const sumField = (rows: { total?: number }[]) => rows[0]?.total ?? 0

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const db = await getDb()
  const orders = db.collection<OrderDoc>('orders')
  const today = todayISTDate()
  const { start, end } = istDayRange(today)

  const [revenueRows, receivedRows, unpaidRows, ordersToday, pendingCount, expenseRows] = await Promise.all([
    // Money actually collected, all time (Razorpay captures + manual marked paid).
    orders.aggregate<{ total: number }>([
      { $match: { payment_status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]).toArray(),
    // Collected today — keyed by when the money landed, not the order's service date.
    orders.aggregate<{ total: number }>([
      { $match: { payment_status: 'paid', paid_at: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]).toArray(),
    // Owed for today's meals but not yet paid.
    orders.aggregate<{ total: number }>([
      { $match: { payment_status: 'pending', created_at: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]).toArray(),
    orders.countDocuments({ created_at: { $gte: start, $lte: end } }),
    orders.countDocuments({ status: 'pending' }),
    db.collection<ExpenseDoc>('expenses').aggregate<{ total: number }>([
      { $match: { date: today } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).toArray(),
  ])

  const today_received = sumField(receivedRows)
  const today_expenses = sumField(expenseRows)

  return success('Analytics summary fetched', {
    total_revenue: sumField(revenueRows),
    orders_today: ordersToday,
    pending_count: pendingCount,
    today_received,
    today_unpaid: sumField(unpaidRows),
    today_expenses,
    net_today: Math.round((today_received - today_expenses) * 100) / 100,
  })
}
