import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, randomUUID } from 'crypto'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { istDateAtNoon, istDayRange, nowIST, todayISTDate } from '@/lib/datetime'
import { isValidDate, parseAmount, EXPENSE_CATEGORIES, MEAL_TYPES, MEAL_VARIANTS } from '@/lib/adminValidation'
import { normalizeSubscription } from '@/lib/subscriptionValidation'
import { buildManualOrder } from '@/lib/manualOrder'
import { buildSubscriptionOrders } from '@/lib/subscription'
import { DeliveryState, ExpenseDoc, MealType, MealVariant, OrderDoc, SubscriptionDoc, UserDoc } from '@/types/db'

const norm = (v: string) => v.replace(/[^\d]/g, '')
const DELIVERY_STATES: DeliveryState[] = ['pending', 'delivered', 'skipped']

// One-shot importer for the pre-platform history. Safe to run twice — customers
// dedupe by mobile, orders by (customer, date, meal), subscriptions by
// (customer, plan, start, end), expenses by (date, category, description, amount).
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  if (!body) return fail('Body required', 400)

  const db = await getDb()
  const users = db.collection<UserDoc>('users')
  const ordersCol = db.collection<OrderDoc>('orders')
  const subsCol = db.collection<SubscriptionDoc>('subscriptions')
  const expensesCol = db.collection<ExpenseDoc>('expenses')
  const now = nowIST()

  const report = {
    customers_created: 0,
    customers_matched: 0,
    orders_created: 0,
    orders_skipped: 0,
    subscriptions_created: 0,
    subscriptions_skipped: 0,
    subscription_meals: 0,
    meals_delivered: 0,
    meals_skipped: 0,
    expenses_created: 0,
    expenses_skipped: 0,
    errors: [] as string[],
  }

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

  // ---- One-off / walk-in orders --------------------------------------------
  for (const o of Array.isArray(body.orders) ? body.orders : []) {
    const mobile = o?.customer_mobile ?? o?.mobile
    if (!mobile || !isValidDate(o?.date)) { report.errors.push(`order bad date/mobile: ${JSON.stringify(o)}`); continue }
    const amt = parseAmount(o?.amount)
    if (amt === null || amt <= 0) { report.errors.push(`order bad amount: ${JSON.stringify(o)}`); continue }

    const meal_type: MealType = MEAL_TYPES.includes(o?.meal_type) ? o.meal_type : 'lunch'
    const meal_variant: MealVariant = MEAL_VARIANTS.includes(o?.meal_variant) ? o.meal_variant : 'rice_bowl'
    const qty = Number.isInteger(o?.quantity) && o.quantity > 0 ? o.quantity : 1

    const user = await resolveCustomer(o?.customer_name ?? o?.name ?? 'Customer', mobile)
    if (!user) { report.errors.push(`order unresolved customer: ${JSON.stringify(o)}`); continue }

    const { start, end } = istDayRange(o.date)
    const match = {
      user_id: user._id,
      source: 'manual' as const,
      meal_type,
      meal_variant,
      created_at: { $gte: start, $lte: end },
    }
    if (o?.delete === true) {
      const r = await ordersCol.deleteMany(match)
      if (r.deletedCount) report.errors.push(`deleted ${r.deletedCount} order(s): ${user.name} ${o.date} ${meal_type} ${meal_variant}`)
      continue
    }
    if (o?.replace === true) {
      // Overwrite: drop any existing matching line, then re-insert below.
      await ordersCol.deleteMany(match)
    } else {
      const dup = await ordersCol.findOne(match)
      if (dup) { report.orders_skipped++; continue }
    }

    const order = await buildManualOrder(db, {
      user,
      date: o.date,
      meal_type,
      meal_variant,
      amount: amt,
      quantity: qty,
      paid: o?.paid !== false,
      notes: o?.notes,
      numberKind: 'legacy',
    })
    if (DELIVERY_STATES.includes(o?.delivery_state) && o.delivery_state !== 'pending') {
      order.delivery_state = o.delivery_state
      order.delivery_marked_at = now
    }
    await ordersCol.insertOne(order)
    report.orders_created++
  }

  // ---- Subscriptions ------------------------------------------------------
  for (const s of Array.isArray(body.subscriptions) ? body.subscriptions : []) {
    const mobile = s?.user_mobile ?? s?.mobile
    const user = mobile ? await resolveCustomer(s?.user_name ?? s?.name ?? 'Customer', mobile, s?.area) : null
    if (!user) { report.errors.push(`subscription unresolved customer: ${JSON.stringify(s)}`); continue }

    const normalized = normalizeSubscription(s)
    if (normalized instanceof NextResponse) {
      report.errors.push(`subscription invalid: ${JSON.stringify(s)}`)
      continue
    }

    if (s?.delete === true) {
      const q = {
        user_id: user._id,
        plan: normalized.plan,
        start_date: normalized.start_date,
        end_date: normalized.end_date,
      }
      const toDelete = await subsCol.find(q).toArray()
      let meals = 0
      for (const doomed of toDelete) {
        const r = await ordersCol.deleteMany({ subscription_id: doomed._id })
        meals += r.deletedCount
      }
      const subGone = await subsCol.deleteMany(q)
      if (subGone.deletedCount) report.errors.push(`deleted ${subGone.deletedCount} subscription(s) + ${meals} meals for ${user.name}`)
      continue
    }

    const paidAt = istDateAtNoon(normalized.start_date) // prepaid up front, not per meal

    const existing = await subsCol.findOne({
      user_id: user._id,
      plan: normalized.plan,
      start_date: normalized.start_date,
      end_date: normalized.end_date,
    })
    if (existing) {
      // Already imported — just correct the paid_at on its paid meals so a
      // prepaid subscription doesn't dribble into "Received Today".
      if (s?.paid !== false) {
        const r = await ordersCol.updateMany(
          { subscription_id: existing._id, payment_status: 'paid' },
          { $set: { paid_at: paidAt, updated_at: now } }
        )
        if (r.modifiedCount) report.errors.push(`resynced paid_at for ${r.modifiedCount} meals of ${user.name}`)
      }
      report.subscriptions_skipped++
      continue
    }

    const sub: SubscriptionDoc = {
      _id: randomUUID(),
      user_id: user._id,
      user_snapshot: { name: user.name, mobile: user.mobile },
      ...normalized,
      status: normalized.end_date < todayISTDate() ? 'ended' : 'active',
      generated_count: 0,
      total_amount: 0,
      created_at: now,
      updated_at: now,
    }

    const genOrders = await buildSubscriptionOrders(db, sub)
    const paid = s?.paid !== false
    const deliveredThrough: string | null = isValidDate(s?.delivered_through) ? s.delivered_through : null
    const skips: { date: string; meal_type: string }[] = Array.isArray(s?.skip) ? s.skip : []
    const skipKey = new Set(skips.map((x) => `${x.date}|${x.meal_type}`))

    for (const go of genOrders) {
      const day = go.created_at.slice(0, 10)
      if (paid) { go.payment_status = 'paid'; go.paid_at = paidAt }
      if (skipKey.has(`${day}|${go.meal_type}`)) {
        go.delivery_state = 'skipped'
        go.delivery_marked_at = now
        report.meals_skipped++
      } else if (deliveredThrough && day <= deliveredThrough) {
        go.delivery_state = 'delivered'
        go.delivery_marked_at = now
        report.meals_delivered++
      }
    }

    if (genOrders.length) await ordersCol.insertMany(genOrders)
    sub.generated_count = genOrders.length
    sub.total_amount = genOrders.reduce((acc, go) => acc + go.total_amount, 0)
    await subsCol.insertOne(sub)
    report.subscriptions_created++
    report.subscription_meals += genOrders.length
  }

  // ---- Expenses ---------------------------------------------------------
  for (const e of Array.isArray(body.expenses) ? body.expenses : []) {
    if (!isValidDate(e?.date)) { report.errors.push(`expense bad date: ${JSON.stringify(e)}`); continue }
    const amt = parseAmount(e?.amount)
    if (amt === null || amt <= 0) { report.errors.push(`expense bad amount: ${JSON.stringify(e)}`); continue }
    const category = EXPENSE_CATEGORIES.includes(e?.category) ? e.category : 'other'
    const description = typeof e?.description === 'string' && e.description.trim() ? e.description.trim() : category

    const dup = await expensesCol.findOne({ date: e.date, category, description, amount: amt })
    if (dup) { report.expenses_skipped++; continue }

    await expensesCol.insertOne({
      _id: randomUUID(),
      date: e.date,
      category,
      description,
      amount: amt,
      created_by: admin.userId,
      created_at: now,
      updated_at: now,
    })
    report.expenses_created++
  }

  return success('Import complete', report)
}
