import { NextRequest } from 'next/server'
import { Filter } from 'mongodb'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { UserDoc } from '@/types/db'

// Walk-in customers only — the people whose orders the admin logs by hand.
// Real website signups stay on /admin/users.
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim().toLowerCase()

  const filter: Record<string, unknown> = { is_walkin: true }
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { mobile: { $regex: q, $options: 'i' } },
    ]
  }

  const db = await getDb()
  const customers = await db
    .collection<UserDoc>('users')
    .find(filter as Filter<UserDoc>, { projection: { password_hash: 0, activation_token: 0, reset_token: 0, fcmTokens: 0 } })
    .sort({ created_at: -1 })
    .toArray()

  return success('Customers fetched', customers, { count: customers.length })
}
