import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

export async function DELETE(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const address_id = body?.address_id ?? req.nextUrl.searchParams.get('address_id')
  if (!address_id) return fail('address_id is required', 400)

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ _id: currentUser.userId }, { projection: { addresses: 1 } })
  if (!user) return fail('User not found', 404)

  const addresses = user.addresses ?? []
  const target = addresses.find((a) => a.address_id === address_id)
  if (!target) return fail('Address not found', 404)

  const remaining = addresses.filter((a) => a.address_id !== address_id)
  if (target.is_default && remaining.length > 0) {
    remaining[0].is_default = true
  }

  await db.collection<UserDoc>('users').updateOne(
    { _id: currentUser.userId },
    { $set: { addresses: remaining, updated_at: nowIST() } }
  )

  return success('Address removed', { address_id })
}
