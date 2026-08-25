import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { success, fail } from '@/lib/apiResponse'
import { generateTempPassword, hashPassword, generateToken, hashToken } from '@/lib/password'
import { sendWelcomeEmail } from '@/lib/email'
import { nowISTDayjs } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

const ACTIVATION_EXPIRY_HOURS = 48
const GENERIC_MESSAGE = 'If an inactive account exists for this email, a new activation email has been sent.'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = body?.email?.trim().toLowerCase()
  if (!email) return fail('email is required', 400)

  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ email, auth_provider: 'credentials' })

  if (!user || user.is_active) {
    // Don't reveal whether the account exists or is already active
    return success(GENERIC_MESSAGE, null)
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)
  const rawToken = generateToken()

  await db.collection<UserDoc>('users').updateOne(
    { _id: user._id },
    {
      $set: {
        password_hash: passwordHash,
        activation_token: hashToken(rawToken),
        activation_token_expires: nowISTDayjs().add(ACTIVATION_EXPIRY_HOURS, 'hour').toISOString(),
      },
    }
  )

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const activationLink = `${appUrl}/activate?token=${rawToken}`

  try {
    await sendWelcomeEmail({ to: email, name: user.name, tempPassword, activationLink })
  } catch (e) {
    console.error('Failed to resend activation email:', e)
  }

  return success(GENERIC_MESSAGE, null)
}
