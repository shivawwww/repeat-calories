import { NextRequest } from 'next/server'
import { Filter } from 'mongodb'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { ExpenseDoc } from '@/types/db'

// GET /api/admin/expenses/getall?date=YYYY-MM-DD  — one day
// GET /api/admin/expenses/getall?from=YYYY-MM-DD&to=YYYY-MM-DD  — a range
// GET /api/admin/expenses/getall  — everything, newest first
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const filter: Record<string, unknown> = {}
  if (date) filter.date = date
  else if (from || to) filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) }

  const db = await getDb()
  const expenses = await db
    .collection<ExpenseDoc>('expenses')
    .find(filter as Filter<ExpenseDoc>)
    .sort({ date: -1, created_at: -1 })
    .toArray()

  return success('Expenses fetched', expenses, { count: expenses.length })
}
