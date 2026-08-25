import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

let ready = false

function init() {
  if (ready) return
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!json) return
  try {
    if (getApps().length === 0) {
      initializeApp({ credential: cert(JSON.parse(json)) })
    }
    ready = true
  } catch (e) {
    console.error('Firebase Admin init error:', e)
  }
}

export interface PushMessage {
  title: string
  body: string
  link?: string
}

// Accepts one token or an array — sends to all of a user's devices.
// Firebase silently ignores invalid/expired tokens; no manual cleanup needed.
export async function sendPush(tokens: string | string[], msg: PushMessage) {
  init()
  if (!ready) return

  const list = (Array.isArray(tokens) ? tokens : [tokens]).filter(Boolean)
  if (list.length === 0) return

  const message = {
    notification: { title: msg.title, body: msg.body },
    webpush: {
      notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' },
      fcmOptions: { link: msg.link ?? '/menu' },
    },
  }

  try {
    if (list.length === 1) {
      await getMessaging().send({ ...message, token: list[0] })
    } else {
      await getMessaging().sendEachForMulticast({ ...message, tokens: list })
    }
  } catch (e) {
    console.error('FCM send error:', e)
  }
}
