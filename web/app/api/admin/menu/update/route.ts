import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { MenuItemDoc } from '@/types/db'

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const { id, ...updates } = body ?? {}
  if (!id) return fail('id is required', 400)

  const allowedFields = [
    'name',
    'description',
    'category',
    'price',
    'image_url',
    'nutrition',
    'is_featured',
    'sort_order',
  ]
  const setOps: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (updates[key] !== undefined) setOps[key] = updates[key]
  }
  if (Object.keys(setOps).length === 0) return fail('No valid fields to update', 400)

  const db = await getDb()
  const result = await db.collection<MenuItemDoc>('menu_items').updateOne({ _id: id }, { $set: setOps })
  if (result.matchedCount === 0) return fail('Menu item not found', 404)

  return success('Menu item updated', { id })
}
