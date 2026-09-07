import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { normalizeSubscription } from '@/lib/subscriptionValidation'
import { previewSubscription } from '@/lib/subscription'

// Live "N orders · ₹total" figure for the create/edit form, plus the first few
// days broken out so the admin can eyeball the salad/wrap rotation before saving.
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const normalized = normalizeSubscription(body)
  if (normalized instanceof NextResponse) return normalized

  return success('Subscription preview', previewSubscription(normalized))
}
