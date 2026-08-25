import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { OrderDoc } from '@/types/db'

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const db = await getDb()
  const orders = await db
    .collection<OrderDoc>('orders')
    .find({ user_id: currentUser.userId })
    .sort({ created_at: -1 })
    .toArray()

  return success('Orders fetched', orders, { count: orders.length })
}
