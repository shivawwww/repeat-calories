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
// rows and subscription date ranges, which are day-granular, not instants.
export function todayISTDate(): string {
  return dayjs().tz(IST).format('YYYY-MM-DD')
}

// A calendar date pinned to 12:00 IST — the `created_at` we stamp on manual /
// subscription / imported orders so they sort into the right day regardless of
// when they were actually keyed in.
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

// Every 'YYYY-MM-DD' between start and end (inclusive) whose weekday (0=Sun..6=Sat)
// is in `weekdays`. Drives subscription daily-order generation.
export function eachDeliveryDay(start: string, end: string, weekdays: number[]): string[] {
  const out: string[] = []
  let cursor = dayjs.tz(start, IST).startOf('day')
  const last = dayjs.tz(end, IST).startOf('day')
  while (!cursor.isAfter(last)) {
    if (weekdays.includes(cursor.day())) out.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day')
  }
  return out
}

// The next `count` delivery days strictly after `afterDate` — used to append
// make-up days when a subscription meal was skipped.
export function nextDeliveryDays(afterDate: string, weekdays: number[], count: number): string[] {
  const out: string[] = []
  let cursor = dayjs.tz(afterDate, IST).startOf('day').add(1, 'day')
  let guard = 0
  while (out.length < count && guard++ < 800) {
    if (weekdays.includes(cursor.day())) out.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day')
  }
  return out
}
