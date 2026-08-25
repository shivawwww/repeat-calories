import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const { label, full_address, area, city, pincode, landmark, lat, lng } = body ?? {}

  if (!label || !full_address || !area || !city || !pincode) {
    return fail('label, full_address, area, city and pincode are required', 400)
  }

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ _id: currentUser.userId }, { projection: { addresses: 1 } })
  if (!user) return fail('User not found', 404)

  const existingAddresses = user.addresses ?? []
  const isFirstAddress = existingAddresses.length === 0

  const newAddress = {
    address_id: uuidv4(),
    label,
    full_address,
    area,
    city,
    pincode,
    landmark: landmark ?? '',
    is_default: isFirstAddress || !!body?.is_default,
    ...(lat !== undefined ? { lat } : {}),
    ...(lng !== undefined ? { lng } : {}),
  }

  if (newAddress.is_default) {
    await db.collection<UserDoc>('users').updateOne(
      { _id: currentUser.userId },
      { $set: { 'addresses.$[].is_default': false } }
    )
  }

  await db.collection<UserDoc>('users').updateOne(
    { _id: currentUser.userId },
    { $push: { addresses: newAddress }, $set: { updated_at: nowIST() } }
  )

  return success('Address added', newAddress, { status: 201 })
}
