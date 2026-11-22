// fm.tba.release#releaseDate is YYYY, YYYY-MM or YYYY-MM-DD. Lexicons can only
// limit string length, so every writer and the indexer must check it here.

export type ReleaseDate =
  | { precision: 'year'; year: number }
  | { precision: 'month'; year: number; month: number }
  | { precision: 'day'; year: number; month: number; day: number }

/** Plausible range for a recorded release. Rejects typos like 0202 or 20277. */
export const MIN_RELEASE_YEAR = 1900
export const MAX_RELEASE_YEAR = 2100

const PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

// Pure arithmetic on purpose: JS Date maps years 0–99 to 1900–1999.
const daysInMonth = (year: number, month: number) =>
  month === 2 ? (isLeapYear(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31

/** Returns the parsed date, or null if it isn't a real calendar date in an accepted shape. */
export function parseReleaseDate(value: string): ReleaseDate | null {
  const m = PATTERN.exec(value)
  if (!m) return null
  const year = Number(m[1])
  if (year < MIN_RELEASE_YEAR || year > MAX_RELEASE_YEAR) return null
  if (m[2] === undefined) return { precision: 'year', year }
  const month = Number(m[2])
  if (month < 1 || month > 12) return null
  if (m[3] === undefined) return { precision: 'month', year, month }
  const day = Number(m[3])
  if (day < 1 || day > daysInMonth(year, month)) return null
  return { precision: 'day', year, month, day }
}
