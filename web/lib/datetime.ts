import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const IST = 'Asia/Kolkata'

// Every timestamp captured anywhere in this app goes through here, so the
// database itself stores true Chennai/IST local time, not raw UTC.
export function nowIST(): string {
  return dayjs().tz(IST).format('YYYY-MM-DDTHH:mm:ssZ')
}

export function formatIST(date: string | Date, format = 'DD MMM YYYY, hh:mm A'): string {
  return dayjs(date).tz(IST).format(format)
}

export function nowISTDayjs() {
  return dayjs().tz(IST)
}

// order_number date component — e.g. "2026" for RC-2026-0001
export function currentISTYear(): number {
  return dayjs().tz(IST).year()
}

// Today in IST as a plain calendar date, e.g. "2026-09-07". Used for expense
// rows and manual-order dates, which are day-granular, not instants.
export function todayISTDate(): string {
  return dayjs().tz(IST).format('YYYY-MM-DD')
}

// A calendar date pinned to 12:00 IST — the `created_at` we stamp on manual /
// imported orders so they sort into the right day regardless of when they
// were actually keyed in.
export function istDateAtNoon(dateStr: string): string {
  return dayjs.tz(`${dateStr} 12:00:00`, IST).format('YYYY-MM-DDTHH:mm:ssZ')
}

// Start / end of a given IST calendar date as ISO strings with the +05:30 offset —
// for range-matching string timestamps that were written by nowIST() / istDateAtNoon().
export function istDayRange(dateStr: string): { start: string; end: string } {
  const d = dayjs.tz(dateStr, IST)
  return {
    start: d.startOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
    end: d.endOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
  }
}

export const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number]

// Which weekday a 'YYYY-MM-DD' calendar date falls on — used to look up the
// per-day standard meal price. No timezone involved; it's plain calendar math.
export function weekdayKey(dateStr: string): WeekdayKey {
  const [y, m, d] = dateStr.split('-').map(Number)
  return WEEKDAY_KEYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}
