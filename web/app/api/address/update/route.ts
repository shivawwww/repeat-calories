import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

export async function PUT(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const { address_id, ...updates } = body ?? {}
  if (!address_id) return fail('address_id is required', 400)

  const allowedFields = ['label', 'full_address', 'area', 'city', 'pincode', 'landmark', 'lat', 'lng']
  const setOps: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (updates[key] !== undefined) setOps[`addresses.$.${key}`] = updates[key]
  }

  if (Object.keys(setOps).length === 0) return fail('No valid fields to update', 400)
  setOps['updated_at'] = nowIST()

  const db = await getDb()
  const result = await db.collection<UserDoc>('users').updateOne(
    { _id: currentUser.userId, 'addresses.address_id': address_id },
    { $set: setOps }
  )

  if (result.matchedCount === 0) return fail('Address not found', 404)

  return success('Address updated', { address_id })
}
