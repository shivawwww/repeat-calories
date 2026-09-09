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

  const [revenueRows, receivedRows, unpaidRows, totalOrders, expenseRows] = await Promise.all([
    // Money actually collected, all time.
    orders.aggregate<{ total: number }>([
      { $match: { payment_status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]).toArray(),
    // Collected today — keyed by when the money landed.
    orders.aggregate<{ total: number }>([
      { $match: { payment_status: 'paid', paid_at: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]).toArray(),
    // Everything still owed, all time.
    orders.aggregate<{ total: number }>([
      { $match: { payment_status: 'pending', status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]).toArray(),
    orders.countDocuments({}),
    db.collection<ExpenseDoc>('expenses').aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).toArray(),
  ])

  const total_revenue = sumField(revenueRows)
  const total_expenses = sumField(expenseRows)

  return success('Analytics summary fetched', {
    total_revenue,
    today_received: sumField(receivedRows),
    total_unpaid: sumField(unpaidRows),
    total_expenses,
    net: Math.round((total_revenue - total_expenses) * 100) / 100,
    total_orders: totalOrders,
  })
}
