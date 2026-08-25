import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

export async function PATCH(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const address_id = body?.address_id
  if (!address_id) return fail('address_id is required', 400)

  const db = await getDb()
  const matched = await db.collection<UserDoc>('users').findOne({
    _id: currentUser.userId,
    'addresses.address_id': address_id,
  })
  if (!matched) return fail('Address not found', 404)

  await db.collection<UserDoc>('users').updateOne(
    { _id: currentUser.userId },
    { $set: { 'addresses.$[].is_default': false, updated_at: nowIST() } }
  )
  await db.collection<UserDoc>('users').updateOne(
    { _id: currentUser.userId, 'addresses.address_id': address_id },
    { $set: { 'addresses.$.is_default': true } }
  )

  return success('Default address updated', { address_id })
}
