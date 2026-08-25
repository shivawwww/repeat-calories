import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { MenuItemDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const { name, description, category, price, image_url, nutrition, is_featured, sort_order } = body ?? {}

  if (!name || !category || price === undefined) {
    return fail('name, category and price are required', 400)
  }

  const db = await getDb()
  const item = {
    _id: uuidv4(),
    name,
    description: description ?? '',
    category,
    price,
    image_url: image_url ?? '',
    nutrition: nutrition ?? { protein_g: 0, carbs_g: 0, fibre_g: 0, calories: 0 },
    is_available: true,
    is_featured: !!is_featured,
    sort_order: sort_order ?? 0,
    created_at: nowIST(),
  }

  await db.collection<MenuItemDoc>('menu_items').insertOne(item)
  return success('Menu item created', item, { status: 201 })
}
