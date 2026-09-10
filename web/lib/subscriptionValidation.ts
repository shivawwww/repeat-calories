import { fail } from '@/lib/apiResponse'
import { isValidDate, parseAmount, SUBSCRIPTION_PLANS } from '@/lib/adminValidation'
import { MealType, SubscriptionPlan } from '@/types/db'

export interface NormalizedSubscriptionFields {
  plan: SubscriptionPlan
  start_date: string
  end_date: string
  delivery_days: number[]
  lunch_price?: number
  dinner_price?: number
  price_type: 'normal' | 'custom'
  rotation_enabled: boolean
  rotation_applies_to: MealType
  rotation_start_with: 'salad' | 'wrap'
  notes?: string
}

// Validates a subscription create/edit payload. Returns either a NextResponse
// error (from fail()) or the normalized fields ready to persist.
export function normalizeSubscription(
  body: Record<string, unknown> | null
): ReturnType<typeof fail> | NormalizedSubscriptionFields {
  if (!body) return fail('Body required', 400)

  const plan = body.plan as SubscriptionPlan
  if (!SUBSCRIPTION_PLANS.includes(plan)) return fail('Invalid plan', 400)
  if (!isValidDate(body.start_date)) return fail('A valid start_date (YYYY-MM-DD) is required', 400)
  if (!isValidDate(body.end_date)) return fail('A valid end_date (YYYY-MM-DD) is required', 400)
  if ((body.end_date as string) < (body.start_date as string)) {
    return fail('end_date must be on or after start_date', 400)
  }
  // Guard against a typo generating tens of thousands of order rows.
  const spanDays =
    (Date.parse(body.end_date as string) - Date.parse(body.start_date as string)) / 86_400_000
  if (spanDays > 186) return fail('Subscription span cannot exceed ~6 months', 400)

  let delivery_days = Array.isArray(body.delivery_days)
    ? (body.delivery_days as unknown[]).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    : [1, 2, 3, 4, 5, 6]
  delivery_days = [...new Set(delivery_days)].sort()
  if (delivery_days.length === 0) return fail('Pick at least one delivery day', 400)

  const needsLunch = plan === 'lunch' || plan === 'lunch_dinner'
  const needsDinner = plan === 'dinner' || plan === 'lunch_dinner'

  const lunch_price = needsLunch ? parseAmount(body.lunch_price) : undefined
  const dinner_price = needsDinner ? parseAmount(body.dinner_price) : undefined
  if (needsLunch && (lunch_price == null || lunch_price <= 0)) return fail('A positive lunch_price is required', 400)
  if (needsDinner && (dinner_price == null || dinner_price <= 0)) return fail('A positive dinner_price is required', 400)

  const rotation_applies_to: MealType = body.rotation_applies_to === 'lunch' ? 'lunch' : 'dinner'
  const rotation_start_with: 'salad' | 'wrap' = body.rotation_start_with === 'wrap' ? 'wrap' : 'salad'
  const planHasMeal = rotation_applies_to === 'lunch' ? needsLunch : needsDinner
  const rotation_enabled = !!body.rotation_enabled && planHasMeal

  return {
    plan,
    start_date: body.start_date as string,
    end_date: body.end_date as string,
    delivery_days,
    lunch_price: lunch_price ?? undefined,
    dinner_price: dinner_price ?? undefined,
    price_type: body.price_type === 'custom' ? 'custom' : 'normal',
    rotation_enabled,
    rotation_applies_to,
    rotation_start_with,
    notes: typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : undefined,
  }
}
