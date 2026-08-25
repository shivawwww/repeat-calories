import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { CartDoc } from '@/types/db'

export async function DELETE() {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const db = await getDb()
  await db.collection<CartDoc>('carts').updateOne(
    { user_id: currentUser.userId },
    { $set: { items: [], total_amount: 0, updated_at: nowIST() } }
  )

  return success('Cart cleared', { items: [], total_amount: 0 })
}
