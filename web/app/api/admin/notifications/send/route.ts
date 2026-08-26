import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { sendPush } from '@/lib/firebase-admin'
import { sendCustomBroadcast } from '@/lib/notify'
import { UserDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const target = body?.target
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const message = typeof body?.body === 'string' ? body.body.trim() : ''
  const link = typeof body?.link === 'string' && body.link.trim() ? body.link.trim() : undefined
  const userId = typeof body?.userId === 'string' ? body.userId : undefined

  if (!title || !message) return fail('title and body are required', 400)
  if (target !== 'all' && target !== 'user') return fail('target must be "all" or "user"', 400)

  const db = await getDb()

  if (target === 'user') {
    if (!userId) return fail('userId is required when target is "user"', 400)
    const user = await db.collection<UserDoc>('users').findOne({ _id: userId })
    if (!user) return fail('User not found', 404)
    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      return fail('This user has no registered devices to notify', 400)
    }
    await sendPush(user.fcmTokens, { title, body: message, link })
    return success('Notification sent', { sentCount: 1 })
  }

  const sentCount = await sendCustomBroadcast(db, { title, body: message, link })
  return success('Notification sent', { sentCount })
}
