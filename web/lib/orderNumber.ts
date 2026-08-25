import { Db } from 'mongodb'
import { currentISTYear } from '@/lib/datetime'
import { CounterDoc } from '@/types/db'

// Atomic per-year sequence via findOneAndUpdate — avoids duplicate order numbers under concurrent orders.
export async function generateOrderNumber(db: Db): Promise<string> {
  const year = currentISTYear()
  const result = await db
    .collection<CounterDoc>('counters')
    .findOneAndUpdate(
      { _id: `order_number_${year}` },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    )

  const seq = result?.seq ?? 1
  return `RC-${year}-${String(seq).padStart(4, '0')}`
}
