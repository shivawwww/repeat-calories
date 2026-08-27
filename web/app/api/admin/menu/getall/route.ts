import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { MenuItemDoc } from '@/types/db'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const db = await getDb()
  const items = await db.collection<MenuItemDoc>('menu_items').find({}).sort({ sort_order: 1 }).toArray()

  return success('Menu items fetched', items, { count: items.length })
}
