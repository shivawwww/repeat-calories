import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { OrderDoc } from '@/types/db'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const db = await getDb()
  const results = await db
    .collection<OrderDoc>('orders')
    .aggregate([
      { $match: { status: { $in: ['confirmed', 'preparing', 'ready', 'delivered'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', total_qty: { $sum: '$items.quantity' } } },
      { $sort: { total_qty: -1 } },
    ])
    .toArray()

  return success(
    'Item sales fetched',
    results.map((r) => ({ name: r._id, total_qty: r.total_qty }))
  )
}
