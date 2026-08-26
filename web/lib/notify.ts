import { Db } from 'mongodb'
import { sendPush, PushMessage } from '@/lib/firebase-admin'
import { NotificationTemplate, pickRandomTemplate } from '@/lib/notificationTemplates'
import { UserDoc } from '@/types/db'

export async function notifyAdminOfNewOrder(db: Db, orderNumber: string, total: number) {
  const admins = await db.collection<UserDoc>('users').find({ is_admin: true }).toArray()
  const tokens = admins.flatMap((a) => a.fcmTokens ?? [])
  if (tokens.length === 0) return
  await sendPush(tokens, {
    title: 'New order received',
    body: `${orderNumber} — ₹${total}`,
    link: '/admin/orders',
  })
}

export async function notifyCustomerOfStatusChange(
  db: Db,
  userId: string,
  orderNumber: string,
  status: string
) {
  const user = await db.collection<UserDoc>('users').findOne({ _id: userId })
  const tokens = user?.fcmTokens ?? []
  if (tokens.length === 0) return
  await sendPush(tokens, {
    title: `Order ${orderNumber}`,
    body: `Your order is now ${status}`,
    link: '/orders',
  })
}

// Used by the lunch/dinner cron reminders — every active user with at least one
// registered device gets a different randomly-picked message from the bank, not
// the same broadcast text, so the whole customer base doesn't see identical copy.
export async function sendMealReminderBroadcast(db: Db, bank: NotificationTemplate[]): Promise<number> {
  const users = await db
    .collection<UserDoc>('users')
    .find({ is_active: true, fcmTokens: { $exists: true, $not: { $size: 0 } } })
    .project<{ fcmTokens: string[] }>({ fcmTokens: 1 })
    .toArray()

  await Promise.allSettled(users.map((u) => sendPush(u.fcmTokens, pickRandomTemplate(bank))))
  return users.length
}

// Used by the admin "send notification" panel — same fixed message to every
// recipient, unlike the randomized meal reminders above.
export async function sendCustomBroadcast(db: Db, msg: PushMessage): Promise<number> {
  const users = await db
    .collection<UserDoc>('users')
    .find({ is_active: true, fcmTokens: { $exists: true, $not: { $size: 0 } } })
    .project<{ fcmTokens: string[] }>({ fcmTokens: 1 })
    .toArray()

  await Promise.allSettled(users.map((u) => sendPush(u.fcmTokens, msg)))
  return users.length
}
