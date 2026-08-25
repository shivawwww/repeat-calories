import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { success, fail } from '@/lib/apiResponse'
import { hashPassword, hashToken } from '@/lib/password'
import { nowIST } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const token = body?.token
  const newPassword = body?.new_password

  if (!token || !newPassword) return fail('token and new_password are required', 400)
  if (newPassword.length < 8) return fail('New password must be at least 8 characters', 400)

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ reset_token: hashToken(token) })

  if (!user) return fail('Invalid or already-used reset link', 400)
  if (!user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return fail('This reset link has expired. Please request a new one.', 400)
  }

  const newHash = await hashPassword(newPassword)
  await db.collection<UserDoc>('users').updateOne(
    { _id: user._id },
    {
      $set: { password_hash: newHash, updated_at: nowIST() },
      $unset: { reset_token: '', reset_token_expires: '' },
    }
  )

  return success('Password reset successfully. You can now sign in.', null)
}
