import { getDb } from '@/lib/db'
import { success } from '@/lib/apiResponse'
import { isCategoryOrderable } from '@/lib/orderCutoff'
import { MenuItemDoc } from '@/types/db'

export async function GET() {
  const db = await getDb()
  const items = await db
    .collection<MenuItemDoc>('menu_items')
    .find({ is_available: true, is_featured: true })
    .sort({ sort_order: 1 })
    .toArray()

  const withOrderable = items.map((item) => ({ ...item, orderable: isCategoryOrderable(item.category) }))

  return success('Featured items fetched', withOrderable, { count: withOrderable.length })
}
