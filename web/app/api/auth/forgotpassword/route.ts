import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { success, fail } from '@/lib/apiResponse'
import { generateToken, hashToken } from '@/lib/password'
import { sendResetPasswordEmail } from '@/lib/email'
import { nowISTDayjs } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

const RESET_EXPIRY_HOURS = 1
const GENERIC_MESSAGE = 'If an account exists for this email, a password reset link has been sent.'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = body?.email?.trim().toLowerCase()
  if (!email) return fail('email is required', 400)

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ email, auth_provider: 'credentials' })

  if (!user) return success(GENERIC_MESSAGE, null)

  const rawToken = generateToken()
  await db.collection<UserDoc>('users').updateOne(
    { _id: user._id },
    {
      $set: {
        reset_token: hashToken(rawToken),
        reset_token_expires: nowISTDayjs().add(RESET_EXPIRY_HOURS, 'hour').toISOString(),
      },
    }
  )

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const resetLink = `${appUrl}/reset-password?token=${rawToken}`

  try {
    await sendResetPasswordEmail({ to: email, name: user.name, resetLink })
  } catch (e) {
    console.error('Failed to send reset password email:', e)
  }

  return success(GENERIC_MESSAGE, null)
}
