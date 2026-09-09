import {
  ExpenseCategory,
  MealType,
  MealVariant,
  SubscriptionPlan,
} from '@/types/db'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'groceries',
  'chicken',
  'gas',
  'packaging',
  'delivery',
  'staff',
  'rent',
  'other',
]

export const MEAL_TYPES: MealType[] = ['lunch', 'dinner']
export const MEAL_VARIANTS: MealVariant[] = ['rice_bowl', 'salad', 'wrap', 'custom']
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = ['lunch', 'dinner', 'lunch_dinner']

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDate(v: unknown): v is string {
  return typeof v === 'string' && DATE_RE.test(v)
}

// Accepts a positive, finite number (or a numeric string). Returns the parsed
// number, or null when it isn't a usable amount.
export function parseAmount(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}
