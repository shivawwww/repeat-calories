import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { success, fail } from '@/lib/apiResponse'
import { hashPassword, verifyPassword, hashToken } from '@/lib/password'
import { nowIST } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const token = body?.token
  const tempPassword = body?.temp_password
  const newPassword = body?.new_password

  if (!token || !tempPassword || !newPassword) {
    return fail('token, temp_password and new_password are required', 400)
  }
  if (newPassword.length < 8) {
    return fail('New password must be at least 8 characters', 400)
  }

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({
    activation_token: hashToken(token),
    auth_provider: 'credentials',
  })

  if (!user) return fail('Invalid or already-used activation link', 400)

  if (!user.activation_token_expires || new Date(user.activation_token_expires) < new Date()) {
    return fail('This activation link has expired. Please request a new one.', 400)
  }

  if (!user.password_hash) return fail('Invalid or already-used activation link', 400)
  const tempMatches = await verifyPassword(tempPassword, user.password_hash)
  if (!tempMatches) return fail('Temporary password is incorrect', 400)

  const newHash = await hashPassword(newPassword)
  await db.collection<UserDoc>('users').updateOne(
    { _id: user._id },
    {
      $set: {
        password_hash: newHash,
        is_active: true,
        updated_at: nowIST(),
      },
      $unset: { activation_token: '', activation_token_expires: '' },
    }
  )

  return success('Account activated. You can now sign in with your new password.', {
    email: user.email,
  })
}
