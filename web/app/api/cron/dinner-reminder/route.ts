import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { success, fail } from '@/lib/apiResponse'
import { sendMealReminderBroadcast } from '@/lib/notify'
import { DINNER_TEMPLATES } from '@/lib/notificationTemplates'

// Triggered by Vercel Cron (see vercel.json) ~1hr before the 4 PM IST dinner
// cutoff. Same CRON_SECRET guard as the lunch reminder route.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return fail('Unauthorized', 401)

  const db = await getDb()
  const sentCount = await sendMealReminderBroadcast(db, DINNER_TEMPLATES)

  return success('Dinner reminders sent', { sentCount })
}
