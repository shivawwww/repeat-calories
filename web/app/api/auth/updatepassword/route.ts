import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { hashPassword, verifyPassword } from '@/lib/password'
import { nowIST } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return fail('Unauthorized', 401)

  const body = await req.json().catch(() => null)
  const currentPassword = body?.current_password
  const newPassword = body?.new_password

  if (!currentPassword || !newPassword) {
    return fail('current_password and new_password are required', 400)
  }
  if (newPassword.length < 8) return fail('New password must be at least 8 characters', 400)

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ _id: currentUser.userId })
  if (!user) return fail('User not found', 404)

  if (user.auth_provider !== 'credentials' || !user.password_hash) {
    return fail('This account signs in with Google and has no password to change', 400)
  }

  const valid = await verifyPassword(currentPassword, user.password_hash)
  if (!valid) return fail('Current password is incorrect', 400)

  const newHash = await hashPassword(newPassword)
  await db.collection<UserDoc>('users').updateOne(
    { _id: user._id },
    { $set: { password_hash: newHash, updated_at: nowIST() } }
  )

  return success('Password updated successfully', null)
}
