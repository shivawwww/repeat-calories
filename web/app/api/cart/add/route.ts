import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { computeTotal } from '@/lib/cart'
import { nowIST } from '@/lib/datetime'
import { CartItem } from '@/types/models'
import { MenuItemDoc, CartDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const menu_item_id = body?.menu_item_id
  const quantity = body?.quantity ?? 1

  if (!menu_item_id || quantity < 1) return fail('menu_item_id and a positive quantity are required', 400)

  const db = await getDb()
  const menuItem = await db.collection<MenuItemDoc>('menu_items').findOne({ _id: menu_item_id, is_available: true })
  if (!menuItem) return fail('Menu item not found or unavailable', 404)

  const cart = await db.collection<CartDoc>('carts').findOne({ user_id: currentUser.userId })
  const items: CartItem[] = cart?.items ?? []

  const existing = items.find((i) => i.menu_item_id === menu_item_id)
  if (existing) {
    existing.quantity += quantity
  } else {
    items.push({
      menu_item_id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      image_url: menuItem.image_url,
    })
  }

  const total_amount = computeTotal(items)
  const now = nowIST()

  await db.collection<CartDoc>('carts').updateOne(
    { user_id: currentUser.userId },
    {
      $set: { user_id: currentUser.userId, items, total_amount, updated_at: now },
      $setOnInsert: { _id: currentUser.userId },
    },
    { upsert: true }
  )

  return success('Item added to cart', { items, total_amount })
}
