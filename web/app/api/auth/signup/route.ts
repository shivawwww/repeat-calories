import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/db'
import { success, fail } from '@/lib/apiResponse'
import { hashPassword, generateTempPassword, generateToken, hashToken } from '@/lib/password'
import { sendWelcomeEmail } from '@/lib/email'
import { nowIST, nowISTDayjs } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

const ACTIVATION_EXPIRY_HOURS = 48

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const name = body?.name?.trim()
  const email = body?.email?.trim().toLowerCase()
  const mobile = body?.mobile?.trim()

  if (!name || !email || !mobile) {
    return fail('name, email and mobile are required', 400)
  }

  const db = await getDb()
  const existing = await db.collection<UserDoc>('users').findOne({ email })
  if (existing) {
    return fail('An account with this email already exists', 409)
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)
  const rawToken = generateToken()
  const now = nowIST()

  const user = {
    _id: uuidv4(),
    name,
    email,
    mobile,
    password_hash: passwordHash,
    auth_provider: 'credentials' as const,
    is_active: false,
    is_admin: false,
    activation_token: hashToken(rawToken),
    activation_token_expires: nowISTDayjs().add(ACTIVATION_EXPIRY_HOURS, 'hour').toISOString(),
    reset_token: null,
    reset_token_expires: null,
    fcmTokens: [] as string[],
    addresses: [],
    created_at: now,
    updated_at: now,
  }

  await db.collection<UserDoc>('users').insertOne(user)

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const activationLink = `${appUrl}/activate?token=${rawToken}`

  try {
    await sendWelcomeEmail({ to: email, name, tempPassword, activationLink })
  } catch (e) {
    console.error('Failed to send welcome email:', e)
    // Account is created either way — resend-activation can retry the email
  }

  return success('Account created. Check your email for your temporary password and activation link.', {
    email,
  })
}
