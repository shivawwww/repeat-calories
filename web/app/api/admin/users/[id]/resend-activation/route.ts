import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { generateTempPassword, hashPassword, generateToken, hashToken } from '@/lib/password'
import { sendWelcomeEmail } from '@/lib/email'
import { nowISTDayjs } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

const ACTIVATION_EXPIRY_HOURS = 48

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const db = await getDb()
  const user = await db.collection<UserDoc>('users').findOne({ _id: id })

  if (!user) return fail('User not found', 404)
  if (user.auth_provider !== 'credentials') return fail('Google sign-ups never need activation', 400)
  if (user.is_active) return fail('This user is already active', 400)

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

  await sendWelcomeEmail({ to: user.email, name: user.name, tempPassword, activationLink })

  return success(`New activation email sent to ${user.email}.`, null)
}
