import { Db } from 'mongodb'
import { sendPush } from '@/lib/firebase-admin'
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
