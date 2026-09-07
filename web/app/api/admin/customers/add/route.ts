import { NextRequest } from 'next/server'
import { randomBytes, randomUUID } from 'crypto'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { AddressDoc, UserDoc } from '@/types/db'

function normalizeMobile(v: string): string {
  return v.replace(/[^\d]/g, '')
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const { name, mobile, area, full_address, notes } = body ?? {}

  if (!name || typeof name !== 'string') return fail('name is required', 400)
  if (!mobile || typeof mobile !== 'string' || normalizeMobile(mobile).length < 10) {
    return fail('A valid mobile number is required', 400)
  }
  const mob = normalizeMobile(mobile)

  const db = await getDb()

  // A walk-in with this mobile already exists — return it rather than duplicating.
  const existing = await db.collection<UserDoc>('users').findOne({ is_walkin: true, mobile: mob })
  if (existing) {
    return success('Customer already exists', existing, { status: 200 })
  }

  const now = nowIST()
  const addresses: AddressDoc[] = []
  if (area || full_address) {
    addresses.push({
      address_id: randomUUID(),
      label: 'Home',
      full_address: full_address ?? '',
      area: area ?? '',
      city: 'Coimbatore',
      pincode: '',
      is_default: true,
    })
  }

  const customer: UserDoc = {
    _id: randomUUID(),
    name: name.trim(),
    email: `walkin-${randomBytes(4).toString('hex')}@repeatcalories.invalid`,
    mobile: mob,
    password_hash: null,
    auth_provider: 'credentials',
    is_active: false,
    is_admin: false,
    activation_token: null,
    activation_token_expires: null,
    reset_token: null,
    reset_token_expires: null,
    fcmTokens: [],
    addresses,
    is_walkin: true,
    walkin_notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
    created_at: now,
    updated_at: now,
  }

  await db.collection<UserDoc>('users').insertOne(customer)
  return success('Customer added', customer, { status: 201 })
}
