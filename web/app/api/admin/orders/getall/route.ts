import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { OrderDoc } from '@/types/db'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const db = await getDb()
  const orders = await db.collection<OrderDoc>('orders').find({}).sort({ created_at: -1 }).toArray()

  return success('Orders fetched', orders, { count: orders.length })
}
