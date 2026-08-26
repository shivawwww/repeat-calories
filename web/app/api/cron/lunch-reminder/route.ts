import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { success, fail } from '@/lib/apiResponse'
import { sendMealReminderBroadcast } from '@/lib/notify'
import { LUNCH_TEMPLATES } from '@/lib/notificationTemplates'

// Triggered by Vercel Cron (see vercel.json) ~1hr before the 10 AM IST lunch
// cutoff. Vercel attaches `Authorization: Bearer $CRON_SECRET` automatically
// on cron-triggered requests when CRON_SECRET is set — no session exists here
// since this isn't a logged-in user, so that header is the only guard.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return fail('Unauthorized', 401)

  const db = await getDb()
  const sentCount = await sendMealReminderBroadcast(db, LUNCH_TEMPLATES)

  return success('Lunch reminders sent', { sentCount })
}
