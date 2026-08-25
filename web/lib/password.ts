import bcrypt from 'bcryptjs'
import { randomBytes, randomInt, createHash } from 'crypto'

const SALT_ROUNDS = 10

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// System-generated temp password sent in the welcome email — e.g. "K7X9QZ4M"
export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid email misreads
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[randomInt(chars.length)]
  return out
}

// For activation_token / reset_token — the raw value only ever goes in the emailed link;
// the DB stores hashToken(raw) so it's both lookup-able (deterministic) and not a bearer secret at rest.
export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}
