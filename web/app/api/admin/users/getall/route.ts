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
    .find({}, { projection: { password_hash: 0, activation_token: 0, reset_token: 0 } })
    .sort({ created_at: -1 })
    .toArray()

  // Device push tokens themselves have no reason to reach the browser — only
  // whether the user has any registered, for the admin notifications picker.
  const withDeviceCount = users.map(({ fcmTokens, ...rest }) => ({
    ...rest,
    fcmTokenCount: fcmTokens?.length ?? 0,
  }))

  return success('Users fetched', withDeviceCount, { count: withDeviceCount.length })
}
