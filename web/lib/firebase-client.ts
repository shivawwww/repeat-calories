import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(firebaseConfig)
}

export async function saveNotificationToken(token: string | null): Promise<void> {
  if (!token) return
  await fetch('/api/notifications/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

export async function removeNotificationToken(token: string | null): Promise<void> {
  if (!token) return
  await fetch('/api/notifications/token', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

// Reads back this device's current token without prompting — used on logout,
// where we must never trigger a fresh permission request.
export async function getExistingFcmToken(): Promise<string | null> {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted' ||
    !('serviceWorker' in navigator) ||
    !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  )
    return null

  try {
    const registration = await navigator.serviceWorker.ready
    const messaging = getMessaging(getApp())
    return await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
  } catch (e) {
    console.error('FCM token lookup error:', e)
    return null
  }
}

export async function registerForNotifications(): Promise<string | null> {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator) ||
    !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  )
    return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    // Wait for an active service worker — iOS Safari fails silently if SW is still installing
    const registration = await navigator.serviceWorker.ready
    const messaging = getMessaging(getApp())
    return await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
  } catch (e) {
    console.error('FCM registration error:', e)
    return null
  }
}
