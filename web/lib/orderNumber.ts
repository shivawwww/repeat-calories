import { Db } from 'mongodb'
import { currentISTYear } from '@/lib/datetime'
import { CounterDoc } from '@/types/db'

// 'online' is the public website series (RC-2026-0001). Manual / subscription /
// imported orders use their own prefixes and their own counters so they never
// inflate or interleave the customer-facing numbering.
export type OrderNumberKind = 'online' | 'manual' | 'subscription' | 'legacy'

const PREFIX: Record<OrderNumberKind, string> = {
  online: 'RC-',
  manual: 'RC-M-',
  subscription: 'RC-S-',
  legacy: 'RC-H-',
}

// Atomic per-year sequence via findOneAndUpdate — avoids duplicate order numbers under concurrent orders.
export async function generateOrderNumber(db: Db, kind: OrderNumberKind = 'online'): Promise<string> {
  const year = currentISTYear()
  const counterId = kind === 'online' ? `order_number_${year}` : `order_number_${kind}_${year}`
  const result = await db
    .collection<CounterDoc>('counters')
    .findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    )

  const seq = result?.seq ?? 1
  return `${PREFIX[kind]}${year}-${String(seq).padStart(4, '0')}`
}
