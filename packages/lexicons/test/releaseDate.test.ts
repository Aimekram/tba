import { describe, expect, it } from 'vitest'
import { parseReleaseDate } from '../src/releaseDate.ts'

describe('parseReleaseDate (the check the lexicon cannot express)', () => {
  it('parses all three precisions', () => {
    expect(parseReleaseDate('2027')).toEqual({ precision: 'year', year: 2027 })
    expect(parseReleaseDate('2027-03')).toEqual({ precision: 'month', year: 2027, month: 3 })
    expect(parseReleaseDate('2027-02-13')).toEqual({ precision: 'day', year: 2027, month: 2, day: 13 })
  })

  it.each(['2027-99-99', '2027-13', '2027-00', '2027-04-31', '2027-02-29', '2027-1-5', '27', '2027/03', ' 2027', ''])(
    'rejects %j',
    (value) => expect(parseReleaseDate(value)).toBeNull(),
  )

  it('rejects implausible years (typos, and the JS Date 0–99 → 19xx trap)', () => {
    for (const value of ['0028-02-29', '0202', '1899-12-31', '2101']) expect(parseReleaseDate(value), value).toBeNull()
  })

  it('knows leap years, including century rules', () => {
    expect(parseReleaseDate('2028-02-29')).not.toBeNull()
    expect(parseReleaseDate('2000-02-29')).not.toBeNull()
    expect(parseReleaseDate('1900-02-29')).toBeNull()
  })
})
