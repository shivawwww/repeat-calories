import type { AuthOptions, Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { nowIST } from '@/lib/datetime'
import { UserDoc } from '@/types/db'

export const authOptions: AuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const db = await getDb()
        const user = await db.collection<UserDoc>('users').findOne({ email: credentials.email.toLowerCase() })
        if (!user) return null

        if (user.auth_provider !== 'credentials' || !user.password_hash) return null

        if (!user.is_active) {
          throw new Error('ACCOUNT_NOT_ACTIVATED')
        }

        const valid = await verifyPassword(credentials.password, user.password_hash)
        if (!valid) return null

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          is_admin: !!user.is_admin,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const db = await getDb()
        const existing = await db.collection<UserDoc>('users').findOne({ email: user.email!.toLowerCase() })

        if (!existing) {
          const now = nowIST()
          const newUser = {
            _id: uuidv4(),
            name: user.name ?? 'Repeat Calories Customer',
            email: user.email!.toLowerCase(),
            mobile: '',
            password_hash: null,
            auth_provider: 'google' as const,
            is_active: true, // Google already verified the email — skip activation entirely
            is_admin: false,
            activation_token: null,
            activation_token_expires: null,
            reset_token: null,
            reset_token_expires: null,
            fcmTokens: [] as string[],
            addresses: [],
            created_at: now,
            updated_at: now,
          }
          await db.collection<UserDoc>('users').insertOne(newUser)
          user.id = newUser._id
          user.is_admin = false
        } else {
          if (!existing.is_active) return false // shouldn't happen for google, but guard anyway
          user.id = existing._id
          user.is_admin = !!existing.is_admin
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.is_admin = user.is_admin
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.is_admin = token.is_admin
      }
      return session
    },
  },
}

export async function getCurrentSession(): Promise<Session | null> {
  return getServerSession(authOptions)
}

export interface CurrentUser {
  userId: string
  email: string
  name: string
  is_admin: boolean
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getCurrentSession()
  if (!session?.user) return null
  const u = session.user
  return { userId: u.id, email: u.email ?? '', name: u.name ?? '', is_admin: !!u.is_admin }
}

export async function getCurrentAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser()
  if (!user?.is_admin) return null
  return user
}
