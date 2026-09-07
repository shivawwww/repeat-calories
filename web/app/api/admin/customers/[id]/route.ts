import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { AddressDoc, UserDoc } from '@/types/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return fail('Body required', 400)

  const db = await getDb()
  const customer = await db.collection<UserDoc>('users').findOne({ _id: id })
  if (!customer || !customer.is_walkin) return fail('Customer not found', 404)

  const update: Record<string, unknown> = { updated_at: nowIST() }
  if (body.name !== undefined) update.name = String(body.name).trim()
  if (body.mobile !== undefined) {
    const mob = String(body.mobile).replace(/[^\d]/g, '')
    if (mob.length < 10) return fail('A valid mobile number is required', 400)
    update.mobile = mob
  }
  if (body.notes !== undefined) update.walkin_notes = body.notes ? String(body.notes).trim() : undefined

  if (body.area !== undefined || body.full_address !== undefined) {
    const addresses = customer.addresses ?? []
    const idx = addresses.findIndex((a) => a.is_default)
    const base: AddressDoc =
      idx >= 0
        ? addresses[idx]
        : { address_id: randomUUID(), label: 'Home', full_address: '', area: '', city: 'Coimbatore', pincode: '', is_default: true }
    const next: AddressDoc = {
      ...base,
      area: body.area !== undefined ? String(body.area).trim() : base.area,
      full_address: body.full_address !== undefined ? String(body.full_address).trim() : base.full_address,
    }
    update.addresses = idx >= 0 ? addresses.map((a, i) => (i === idx ? next : a)) : [...addresses, next]
  }

  await db.collection<UserDoc>('users').updateOne({ _id: id }, { $set: update })
  return success('Customer updated', { id })
}
