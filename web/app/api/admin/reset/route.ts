import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'

const CONFIRM = 'DELETE EVERYTHING'

// ⚠️ One-off clean-slate wipe. Removes all operational data so the company can
// re-enter its history from scratch. Keeps: the admin user, real website
// signups, and the menu. This route is intended to be removed after use.
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  if (body?.confirm !== CONFIRM) {
    return fail(`Send { "confirm": "${CONFIRM}" } to proceed`, 400)
  }

  const db = await getDb()
  const [orders, subscriptions, expenses, carts, walkins, counters] = await Promise.all([
    db.collection('orders').deleteMany({}),
    db.collection('subscriptions').deleteMany({}),
    db.collection('expenses').deleteMany({}),
    db.collection('carts').deleteMany({}),
    db.collection('users').deleteMany({ is_walkin: true }),
    db.collection('counters').deleteMany({}),
  ])

  return success('Database wiped', {
    orders: orders.deletedCount,
    subscriptions: subscriptions.deletedCount,
    expenses: expenses.deletedCount,
    carts: carts.deletedCount,
    walkin_customers: walkins.deletedCount,
    counters: counters.deletedCount,
  })
}
