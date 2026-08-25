'use client'

import { useCallback } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { getExistingFcmToken, removeNotificationToken } from '@/lib/firebase-client'

export function useAuth() {
  const { data: session, status } = useSession()

  const logout = useCallback(async (callbackUrl = '/login') => {
    const token = await getExistingFcmToken()
    if (token) await removeNotificationToken(token)
    await signOut({ callbackUrl })
  }, [])

  return {
    user: session?.user ?? null,
    isAuthenticated: status === 'authenticated',
    isAdmin: !!session?.user?.is_admin,
    loading: status === 'loading',
    logout,
  }
}
