import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST, todayISTDate } from '@/lib/datetime'
import { EXPENSE_CATEGORIES, isValidDate, parseAmount } from '@/lib/adminValidation'
import { ExpenseDoc } from '@/types/db'

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const { date, category, description, amount, notes } = body ?? {}

  const amt = parseAmount(amount)
  if (amt === null || amt <= 0) return fail('A positive amount is required', 400)
  if (!EXPENSE_CATEGORIES.includes(category)) return fail('Invalid category', 400)
  if (!description || typeof description !== 'string') return fail('description is required', 400)

  const now = nowIST()
  const expense: ExpenseDoc = {
    _id: uuidv4(),
    date: isValidDate(date) ? date : todayISTDate(),
    category,
    description: description.trim(),
    amount: amt,
    notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
    created_by: admin.userId,
    created_at: now,
    updated_at: now,
  }

  const db = await getDb()
  await db.collection<ExpenseDoc>('expenses').insertOne(expense)
  return success('Expense added', expense, { status: 201 })
}
