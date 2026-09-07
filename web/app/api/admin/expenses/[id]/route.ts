import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { nowIST } from '@/lib/datetime'
import { EXPENSE_CATEGORIES, isValidDate, parseAmount } from '@/lib/adminValidation'
import { ExpenseDoc } from '@/types/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return fail('Body required', 400)

  const update: Record<string, unknown> = { updated_at: nowIST() }
  if (body.date !== undefined) {
    if (!isValidDate(body.date)) return fail('Invalid date', 400)
    update.date = body.date
  }
  if (body.category !== undefined) {
    if (!EXPENSE_CATEGORIES.includes(body.category)) return fail('Invalid category', 400)
    update.category = body.category
  }
  if (body.description !== undefined) update.description = String(body.description).trim()
  if (body.amount !== undefined) {
    const amt = parseAmount(body.amount)
    if (amt === null || amt <= 0) return fail('A positive amount is required', 400)
    update.amount = amt
  }
  if (body.notes !== undefined) update.notes = body.notes ? String(body.notes).trim() : undefined

  const db = await getDb()
  const res = await db.collection<ExpenseDoc>('expenses').updateOne({ _id: id }, { $set: update })
  if (!res.matchedCount) return fail('Expense not found', 404)
  return success('Expense updated', { id })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const { id } = await params
  const db = await getDb()
  const res = await db.collection<ExpenseDoc>('expenses').deleteOne({ _id: id })
  if (!res.deletedCount) return fail('Expense not found', 404)
  return success('Expense deleted', { id })
}
