import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { OrderDoc } from '@/types/db'

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const status = req.nextUrl.searchParams.get('status')
  if (!status) return fail('status query param is required', 400)

  const db = await getDb()
  const orders = await db.collection<OrderDoc>('orders').find({ status }).sort({ created_at: -1 }).toArray()

  return success('Orders fetched', orders, { count: orders.length })
}
