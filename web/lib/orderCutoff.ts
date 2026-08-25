import { nowISTDayjs } from '@/lib/datetime'

// Same-day cutoffs from the brand brief (PLAN.md §19): lunch before 10:00 AM IST,
// dinner before 4:00 PM IST. Categories not listed here have no cutoff.
const CUTOFFS: Record<string, { hour: number; minute: number }> = {
  Lunch: { hour: 10, minute: 0 },
  Dinner: { hour: 16, minute: 0 },
}

export function isCategoryOrderable(category: string): boolean {
  const cutoff = CUTOFFS[category]
  if (!cutoff) return true

  const now = nowISTDayjs()
  const cutoffTime = now.hour(cutoff.hour).minute(cutoff.minute).second(0)
  return now.isBefore(cutoffTime)
}

export function cutoffMessage(category: string): string | null {
  const cutoff = CUTOFFS[category]
  if (!cutoff) return null
  const label = cutoff.hour < 12 ? `${cutoff.hour}:00 AM` : `${cutoff.hour - 12}:00 PM`
  return `${category} orders close at ${label} IST for same-day delivery.`
}
