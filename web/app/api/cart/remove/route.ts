import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { computeTotal } from '@/lib/cart'
import { nowIST } from '@/lib/datetime'
import { CartItem } from '@/types/models'
import { CartDoc } from '@/types/db'

export async function DELETE(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const menu_item_id = body?.menu_item_id ?? req.nextUrl.searchParams.get('menu_item_id')
  if (!menu_item_id) return fail('menu_item_id is required', 400)

  const db = await getDb()
  const cart = await db.collection<CartDoc>('carts').findOne({ user_id: currentUser.userId })
  if (!cart) return fail('Cart not found', 404)

  const items: CartItem[] = (cart.items ?? []).filter((i: CartItem) => i.menu_item_id !== menu_item_id)
  const total_amount = computeTotal(items)

  await db.collection<CartDoc>('carts').updateOne(
    { user_id: currentUser.userId },
    { $set: { items, total_amount, updated_at: nowIST() } }
  )

  return success('Item removed from cart', { items, total_amount })
}
