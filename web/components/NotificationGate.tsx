'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { registerForNotifications, saveNotificationToken } from '@/lib/firebase-client'

type Permission = NotificationPermission | 'unsupported' | 'checking'

// Public/pre-auth routes never need a notification prompt.
const EXCLUDED_PREFIXES = ['/login', '/signup', '/activate', '/forgot', '/reset-password']

function readBrowserPermission(): Permission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export default function NotificationGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const loggedIn = status === 'authenticated'
  const pathname = usePathname()
  const [permission, setPermission] = useState<Permission>(readBrowserPermission)
  const [enabling, setEnabling] = useState(false)
  const reregisteredRef = useRef(false)

  function checkPermission() {
    setPermission(readBrowserPermission())
  }

  // Re-check on every login transition so an already-open session gets gated on
  // its very next in-app tap, not just at next login. Re-reading a browser API
  // (not React state) in response to this transition, so it can't cascade.
  useEffect(() => {
    // Re-reads a browser API (not React state) on a login transition; can't cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkPermission()
  }, [loggedIn])

  // Catches "granted it in browser settings while this tab was backgrounded"
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkPermission()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (!loggedIn) reregisteredRef.current = false
  }, [loggedIn])

  // Already granted — silently (re-)register so the token/device list stays fresh
  useEffect(() => {
    if (loggedIn && permission === 'granted' && !reregisteredRef.current) {
      reregisteredRef.current = true
      registerForNotifications().then(saveNotificationToken)
    }
  }, [loggedIn, permission])

  const excludedRoute = pathname === '/' || EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))
  const blocked = loggedIn && !excludedRoute && (permission === 'default' || permission === 'denied')

  useEffect(() => {
    if (!blocked) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [blocked])

  async function handleEnable() {
    setEnabling(true)
    const token = await registerForNotifications()
    if (token) await saveNotificationToken(token)
    setEnabling(false)
    checkPermission()
  }

  return (
    <>
      {children}
      {blocked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(45,106,79,0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: 380,
              width: '100%',
              textAlign: 'center',
              background: '#F5EFE7',
              borderRadius: 24,
              padding: '36px 28px',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 16 }}>🔔</div>
            {permission === 'denied' ? (
              <>
                <h2 style={{ fontSize: 20, color: '#2D6A4F', marginBottom: 10, fontWeight: 700 }}>
                  Notifications are blocked
                </h2>
                <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.65, marginBottom: 24 }}>
                  Repeat Calories needs notification permission so you never miss an order update. You&apos;ve
                  blocked it for this site — open your browser&apos;s site settings (Settings → Notifications →
                  Allow), then come back here.
                </p>
                <button
                  onClick={checkPermission}
                  style={{
                    width: '100%',
                    padding: '13px 24px',
                    borderRadius: 11,
                    border: 'none',
                    background: '#E87722',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  I&apos;ve enabled it — Recheck
                </button>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 20, color: '#2D6A4F', marginBottom: 10, fontWeight: 700 }}>
                  Turn on notifications to continue
                </h2>
                <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.65, marginBottom: 24 }}>
                  We use push notifications to tell you the moment your order is confirmed, preparing, or out for
                  delivery. This is required to use Repeat Calories.
                </p>
                <button
                  onClick={handleEnable}
                  disabled={enabling}
                  style={{
                    width: '100%',
                    padding: '13px 24px',
                    borderRadius: 11,
                    border: 'none',
                    background: '#E87722',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: enabling ? 'not-allowed' : 'pointer',
                    opacity: enabling ? 0.7 : 1,
                  }}
                >
                  {enabling ? 'Enabling…' : 'Enable Notifications'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
