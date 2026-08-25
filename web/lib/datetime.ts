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
