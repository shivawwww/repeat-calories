import { NextRequest } from 'next/server'
import { Filter } from 'mongodb'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { istDayRange, todayISTDate } from '@/lib/datetime'
import { OrderDoc } from '@/types/db'

// GET /api/admin/orders/getall
//   ?date=YYYY-MM-DD   orders whose service date (created_at, IST) is that day
//   ?source=online|manual
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const source = searchParams.get('source')
  const payment = searchParams.get('payment')

  const filter: Record<string, unknown> = {}
  if (date) {
    const { start, end } = istDayRange(date)
    filter.created_at = { $gte: start, $lte: end }
  }
  if (payment === 'paid') filter.payment_status = 'paid'
  else if (payment === 'unpaid') filter.payment_status = 'pending'
  else if (payment === 'owed') {
    // Unpaid AND past service date (not future).
    filter.payment_status = 'pending'
    filter.created_at = { ...(filter.created_at as object), $lte: istDayRange(todayISTDate()).end }
  }
  // Legacy website orders predate the `source` field — treat missing as 'online'.
  if (source === 'online') filter.source = { $ne: 'manual' }
  else if (source === 'manual') filter.source = 'manual'

  const db = await getDb()
  const orders = await db
    .collection<OrderDoc>('orders')
    .find(filter as Filter<OrderDoc>)
    .sort({ created_at: -1 })
    .toArray()

  return success('Orders fetched', orders, { count: orders.length })
}
