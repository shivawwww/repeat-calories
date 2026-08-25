import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { CartDoc } from '@/types/db'

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const db = await getDb()
  const cart = await db.collection<CartDoc>('carts').findOne({ user_id: currentUser.userId })

  if (!cart) {
    return success('Cart fetched', {
      id: currentUser.userId,
      user_id: currentUser.userId,
      items: [],
      total_amount: 0,
    })
  }

  return success('Cart fetched', cart)
}
