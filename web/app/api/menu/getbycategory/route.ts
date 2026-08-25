import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { success, fail } from '@/lib/apiResponse'
import { isCategoryOrderable } from '@/lib/orderCutoff'
import { MenuItemDoc } from '@/types/db'

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category')
  if (!category) return fail('category query param is required', 400)

  const db = await getDb()
  const items = await db
    .collection<MenuItemDoc>('menu_items')
    .find({ is_available: true, category })
    .sort({ sort_order: 1 })
    .toArray()

  const withOrderable = items.map((item) => ({ ...item, orderable: isCategoryOrderable(item.category) }))

  return success('Menu items fetched', withOrderable, { count: withOrderable.length })
}
