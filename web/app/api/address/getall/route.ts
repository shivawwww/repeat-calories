import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { UserDoc } from '@/types/db'

export async function GET() {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ _id: currentUser.userId }, { projection: { addresses: 1 } })
  if (!user) return fail('User not found', 404)

  return success('Addresses fetched', user.addresses ?? [], { count: (user.addresses ?? []).length })
}
