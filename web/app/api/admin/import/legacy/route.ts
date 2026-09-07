import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, randomUUID } from 'crypto'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { istDayRange, nowIST } from '@/lib/datetime'
import { isValidDate, parseAmount, MEAL_TYPES, MEAL_VARIANTS } from '@/lib/adminValidation'
import { normalizeSubscription } from '@/lib/subscriptionValidation'
import { buildManualOrder } from '@/lib/manualOrder'
import { buildSubscriptionOrders } from '@/lib/subscription'
import { MealType, MealVariant, OrderDoc, SubscriptionDoc, UserDoc } from '@/types/db'

const norm = (v: string) => v.replace(/[^\d]/g, '')

// One-shot importer for the pre-platform order history. Safe to run twice —
// customers dedupe by mobile, orders by (customer, date, meal), subscriptions by
// (customer, plan, start, end).
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  if (!body) return fail('Body required', 400)

  const db = await getDb()
  const users = db.collection<UserDoc>('users')
  const ordersCol = db.collection<OrderDoc>('orders')
  const subsCol = db.collection<SubscriptionDoc>('subscriptions')
  const now = nowIST()

  const report = {
    customers_created: 0,
    customers_matched: 0,
    orders_created: 0,
    orders_skipped: 0,
    subscriptions_created: 0,
    subscriptions_skipped: 0,
    errors: [] as string[],
  }

  // Resolve (creating if needed) a walk-in customer by mobile. Cached per request.
  const cache = new Map<string, UserDoc>()
  async function resolveCustomer(name: string, mobile: string, area?: string): Promise<UserDoc | null> {
    const mob = norm(mobile)
    if (mob.length < 10) return null
    if (cache.has(mob)) return cache.get(mob)!

    let user = await users.findOne({ mobile: mob })
    if (user) {
      report.customers_matched++
    } else {
      user = {
        _id: randomUUID(),
        name: (name || 'Customer').trim(),
        email: `walkin-${randomBytes(4).toString('hex')}@repeatcalories.invalid`,
        mobile: mob,
        password_hash: null,
        auth_provider: 'credentials',
        is_active: false,
        is_admin: false,
        activation_token: null,
        activation_token_expires: null,
        reset_token: null,
        reset_token_expires: null,
        fcmTokens: [],
        addresses: area
          ? [{ address_id: randomUUID(), label: 'Home', full_address: '', area, city: 'Coimbatore', pincode: '', is_default: true }]
          : [],
        is_walkin: true,
        created_at: now,
        updated_at: now,
      }
      await users.insertOne(user)
      report.customers_created++
    }
    cache.set(mob, user)
    return user
  }

  for (const c of Array.isArray(body.customers) ? body.customers : []) {
    if (!c?.mobile || !c?.name) { report.errors.push(`customer missing name/mobile: ${JSON.stringify(c)}`); continue }
    await resolveCustomer(c.name, c.mobile, c.area)
  }

  for (const o of Array.isArray(body.orders) ? body.orders : []) {
    const mobile = o?.customer_mobile ?? o?.mobile
    if (!mobile || !isValidDate(o?.date)) { report.errors.push(`order bad date/mobile: ${JSON.stringify(o)}`); continue }
    const amt = parseAmount(o?.amount)
    if (amt === null || amt <= 0) { report.errors.push(`order bad amount: ${JSON.stringify(o)}`); continue }

    const meal_type: MealType = MEAL_TYPES.includes(o?.meal_type) ? o.meal_type : 'lunch'
    const meal_variant: MealVariant = MEAL_VARIANTS.includes(o?.meal_variant) ? o.meal_variant : 'normal'

    const user = await resolveCustomer(o?.customer_name ?? o?.name ?? 'Customer', mobile)
    if (!user) { report.errors.push(`order unresolved customer: ${JSON.stringify(o)}`); continue }

    const { start, end } = istDayRange(o.date)
    const dup = await ordersCol.findOne({
      user_id: user._id,
      source: 'manual',
      meal_type,
      created_at: { $gte: start, $lte: end },
    })
    if (dup) { report.orders_skipped++; continue }

    const order = await buildManualOrder(db, {
      user,
      date: o.date,
      meal_type,
      meal_variant,
      amount: amt,
      paid: o?.paid !== false, // default paid — historical money already received
      notes: o?.notes,
      numberKind: 'legacy',
    })
    await ordersCol.insertOne(order)
    report.orders_created++
  }

  for (const s of Array.isArray(body.subscriptions) ? body.subscriptions : []) {
    const mobile = s?.user_mobile ?? s?.mobile
    const user = mobile ? await resolveCustomer(s?.user_name ?? s?.name ?? 'Customer', mobile, s?.area) : null
    if (!user) { report.errors.push(`subscription unresolved customer: ${JSON.stringify(s)}`); continue }

    const normalized = normalizeSubscription(s)
    if (normalized instanceof NextResponse) {
      report.errors.push(`subscription invalid: ${JSON.stringify(s)}`)
      continue
    }

    const existing = await subsCol.findOne({
      user_id: user._id,
      plan: normalized.plan,
      start_date: normalized.start_date,
      end_date: normalized.end_date,
    })
    if (existing) { report.subscriptions_skipped++; continue }

    const sub: SubscriptionDoc = {
      _id: randomUUID(),
      user_id: user._id,
      user_snapshot: { name: user.name, mobile: user.mobile },
      ...normalized,
      status: 'active',
      generated_count: 0,
      total_amount: 0,
      created_at: now,
      updated_at: now,
    }
    const genOrders = await buildSubscriptionOrders(db, sub)
    // Historical subscription meals were already paid for.
    for (const go of genOrders) {
      if (s?.paid !== false) { go.payment_status = 'paid'; go.paid_at = go.created_at }
    }
    if (genOrders.length) await ordersCol.insertMany(genOrders)
    sub.generated_count = genOrders.length
    sub.total_amount = genOrders.reduce((acc, go) => acc + go.total_amount, 0)
    await subsCol.insertOne(sub)
    report.subscriptions_created++
  }

  return success('Import complete', report)
}
