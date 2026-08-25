import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { computeTotal } from '@/lib/cart'
import { nowIST } from '@/lib/datetime'
import { CartItem } from '@/types/models'
import { CartDoc } from '@/types/db'

export async function PUT(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const menu_item_id = body?.menu_item_id
  const quantity = body?.quantity

  if (!menu_item_id || quantity === undefined) return fail('menu_item_id and quantity are required', 400)

  const db = await getDb()
  const cart = await db.collection<CartDoc>('carts').findOne({ user_id: currentUser.userId })
  if (!cart) return fail('Cart not found', 404)

  let items: CartItem[] = cart.items ?? []
  const existing = items.find((i) => i.menu_item_id === menu_item_id)
  if (!existing) return fail('Item not in cart', 404)

  if (quantity <= 0) {
    items = items.filter((i) => i.menu_item_id !== menu_item_id)
  } else {
    existing.quantity = quantity
  }

  const total_amount = computeTotal(items)

  await db.collection<CartDoc>('carts').updateOne(
    { user_id: currentUser.userId },
    { $set: { items, total_amount, updated_at: nowIST() } }
  )

  return success('Cart quantity updated', { items, total_amount })
}
