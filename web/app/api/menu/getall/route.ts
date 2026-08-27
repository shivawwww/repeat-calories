import { getDb } from '@/lib/db'
import { success } from '@/lib/apiResponse'
import { MenuItemDoc } from '@/types/db'

// Items can be tagged for more than one meal time now, so whether an item is
// "orderable" depends on which tab it's being viewed under, not the item
// itself — the client computes that per active tab via isCategoryOrderable().
export async function GET() {
  const db = await getDb()
  const items = await db.collection<MenuItemDoc>('menu_items').find({ is_available: true }).sort({ sort_order: 1 }).toArray()

  return success('Menu items fetched', items, { count: items.length })
}
