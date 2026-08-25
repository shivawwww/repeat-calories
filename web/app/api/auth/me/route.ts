import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { UserDoc } from '@/types/db'

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const db = await getDb()
  const user = await db
    .collection<UserDoc>('users')
    .findOne(
      { _id: currentUser.userId },
      { projection: { password_hash: 0, activation_token: 0, activation_token_expires: 0, reset_token: 0, reset_token_expires: 0, fcmTokens: 0 } }
    )
  if (!user) return fail('User not found', 404)

  return success('Profile fetched', user)
}
