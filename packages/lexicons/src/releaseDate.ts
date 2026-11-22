// Lexicons can only limit a string's length, so the release date format is enforced here.

export type ReleaseDate =
  | { precision: 'year'; year: number }
  | { precision: 'month'; year: number; month: number }
  | { precision: 'day'; year: number; month: number; day: number }

// Sanity bounds to catch typos like 0202, not a claim about music history.
export const MIN_RELEASE_YEAR = 1900
export const MAX_RELEASE_YEAR = 2100

const RELEASE_DATE_PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/
const THIRTY_DAY_MONTHS = [4, 6, 9, 11]

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

// Plain arithmetic, not Date: JS Date maps years 0–99 to 1900–1999.
const daysInMonth = (year: number, month: number) => {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return THIRTY_DAY_MONTHS.includes(month) ? 30 : 31
}

export function parseReleaseDate(value: string): ReleaseDate | null {
  const match = RELEASE_DATE_PATTERN.exec(value)
  if (!match) return null
  const [, yearText, monthText, dayText] = match

  const year = Number(yearText)
  if (year < MIN_RELEASE_YEAR || year > MAX_RELEASE_YEAR) return null
  if (monthText === undefined) return { precision: 'year', year }

  const month = Number(monthText)
  if (month < 1 || month > 12) return null
  if (dayText === undefined) return { precision: 'month', year, month }

  const day = Number(dayText)
  if (day < 1 || day > daysInMonth(year, month)) return null
  return { precision: 'day', year, month, day }
}
