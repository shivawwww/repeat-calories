import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { UserDoc } from '@/types/db'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const db = await getDb()
  const users = await db
    .collection<UserDoc>('users')
    .find({}, { projection: { password_hash: 0, activation_token: 0, reset_token: 0, fcmTokens: 0 } })
    .sort({ created_at: -1 })
    .toArray()

  return success('Users fetched', users, { count: users.length })
}
