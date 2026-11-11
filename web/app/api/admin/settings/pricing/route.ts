import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { parseAmount } from '@/lib/adminValidation'
import { DayPrices, PricingSettingsDoc } from '@/types/db'

const PRICING_ID = 'pricing'
const DAYS: (keyof DayPrices)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const EMPTY_DAYS = (): DayPrices => ({ sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 })

function parseDayPrices(v: unknown): DayPrices | null {
  if (typeof v !== 'object' || v === null) return null
  const out = EMPTY_DAYS()
  for (const day of DAYS) {
    const n = parseAmount((v as Record<string, unknown>)[day])
    if (n === null) return null
    out[day] = n
  }
  return out
}

// GET /api/admin/settings/pricing — the per-weekday "Standard" lunch/dinner
// prices used to prefill the manual-order form. 0 means no standard price
// that day (e.g. kitchen closed) — defaults to all-zero if unset.
export async function GET() {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const db = await getDb()
  const doc = await db.collection<PricingSettingsDoc>('settings').findOne({ _id: PRICING_ID })
  return success('Pricing settings', {
    lunch: doc?.lunch ?? EMPTY_DAYS(),
    dinner: doc?.dinner ?? EMPTY_DAYS(),
  })
}

// PATCH /api/admin/settings/pricing { lunch: {sun..sat}, dinner: {sun..sat} }
export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const lunch = parseDayPrices(body?.lunch)
  const dinner = parseDayPrices(body?.dinner)
  if (!lunch || !dinner) return fail('lunch and dinner must each have non-negative prices for every day', 400)

  const db = await getDb()
  const now = nowIST()
  await db.collection<PricingSettingsDoc>('settings').updateOne(
    { _id: PRICING_ID },
    { $set: { lunch, dinner, updated_at: now } },
    { upsert: true }
  )

  return success('Pricing settings saved', { lunch, dinner })
}
