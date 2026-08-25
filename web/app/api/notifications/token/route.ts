import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { UserDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const token = body?.token
  if (!token || typeof token !== 'string') return fail('Invalid token', 400)

  const db = await getDb()
  await db.collection<UserDoc>('users').updateOne({ _id: currentUser.userId }, { $addToSet: { fcmTokens: token } })

  return success('Notification token saved', { ok: true })
}

// Called on logout so a shared device stops receiving pushes for the account that just logged out.
export async function DELETE(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => ({}))
  const token = typeof body?.token === 'string' ? body.token : null
  if (!token) return fail('Invalid token', 400)

  const db = await getDb()
  await db.collection<UserDoc>('users').updateOne({ _id: currentUser.userId }, { $pull: { fcmTokens: token } })

  return success('Notification token removed', { ok: true })
}
