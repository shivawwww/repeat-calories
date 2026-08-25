import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { MenuItemDoc } from '@/types/db'

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const { id } = body ?? {}
  if (!id) return fail('id is required', 400)

  const db = await getDb()
  const item = await db.collection<MenuItemDoc>('menu_items').findOne({ _id: id })
  if (!item) return fail('Menu item not found', 404)

  await db.collection<MenuItemDoc>('menu_items').updateOne({ _id: id }, { $set: { is_available: !item.is_available } })

  return success('Menu item availability toggled', { id, is_available: !item.is_available })
}
