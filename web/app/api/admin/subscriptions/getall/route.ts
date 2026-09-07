import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { SubscriptionDoc } from '@/types/db'

export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const db = await getDb()
  const subs = await db
    .collection<SubscriptionDoc>('subscriptions')
    .find({})
    .sort({ created_at: -1 })
    .toArray()

  return success('Subscriptions fetched', subs, { count: subs.length })
}
