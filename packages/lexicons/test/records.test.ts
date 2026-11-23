import { describe, expect, it } from 'vitest'
import { community, fm } from '../src/lexicons/index.ts'

const TBA_SEEDER_DID = 'did:plc:tbaseederaaaaaaaaaaaaaaa'
const BAND_DID = 'did:plc:bandaaaaaaaaaaaaaaaaaaaa'
const EVENT_URI = `at://${TBA_SEEDER_DID}/community.lexicon.calendar.event/3lbtestevent22`
const EVENT_CID = 'bafyreigqh6tvhgfifv647ns2jck3gwe6hvmqsehbow7zuhoviwle2esysm'
const MUSICBRAINZ_ARTIST_ID = 'f59c5520-5f46-4d2c-b2c4-822eabf53419'
const TIMESTAMP = '2026-11-21T20:00:00.000Z'

type ValidationIssue = { readonly path: readonly PropertyKey[] }
type ValidationResult = { readonly success: boolean; readonly issues?: readonly ValidationIssue[] }
type Schema = { safeParse: (record: unknown) => ValidationResult }

const expectValid = (schema: Schema, record: unknown) => {
  const result = schema.safeParse(record)
  expect(result.success, JSON.stringify(result)).toBe(true)
}

// A missing key is reported on its parent object's path, with `key` naming it.
const expectRejectedAt = (schema: Schema, record: unknown, path: PropertyKey[]) => {
  const result = schema.safeParse(record)
  expect(result.success).toBe(false)
  expect(result.issues?.map((issue) => issue.path), JSON.stringify(result)).toContainEqual(path)
}

describe('fm.tba.artist', () => {
  const artist = {
    $type: 'fm.tba.artist',
    name: 'Example Band',
    genres: ['black metal', 'atmospheric'],
    origin: 'Bergen, Norway',
    links: [{ uri: 'https://example.bandcamp.com', kind: 'bandcamp' }],
    externalIds: [{ source: 'musicbrainz', id: MUSICBRAINZ_ARTIST_ID }],
    createdAt: TIMESTAMP,
  }
  it('accepts a profile', () => expectValid(fm.tba.artist.main, artist))
  it('accepts ids from catalogues TBA has not listed (open knownValues)', () =>
    expectValid(fm.tba.artist.main, { ...artist, externalIds: [{ source: 'metal-archives', id: '3540' }] }))
  it('an external id needs a source', () =>
    expectRejectedAt(fm.tba.artist.main, { ...artist, externalIds: [{ id: MUSICBRAINZ_ARTIST_ID }] }, ['externalIds', 0]))
  it('requires a name', () => expectRejectedAt(fm.tba.artist.main, { ...artist, name: undefined }, ['name']))
  it('caps genre tags at 10', () =>
    expectRejectedAt(fm.tba.artist.main, { ...artist, genres: Array(11).fill('doom') }, ['genres']))
  it('rejects non-URI links', () =>
    expectRejectedAt(fm.tba.artist.main, { ...artist, links: [{ uri: 'not a url' }] }, ['links', 0, 'uri']))
})

describe('fm.tba.release', () => {
  const release = {
    $type: 'fm.tba.release',
    title: 'Debut',
    releaseType: 'album',
    releaseDate: '2027-02-13',
    createdAt: TIMESTAMP,
  }
  it('accepts an announced (future) album', () => expectValid(fm.tba.release.main, release))
  it('accepts year-only and month-only announcements', () => {
    expectValid(fm.tba.release.main, { ...release, releaseDate: '2027' })
    expectValid(fm.tba.release.main, { ...release, releaseDate: '2027-03' })
  })
  it('accepts a release type TBA has not listed yet (open knownValues)', () =>
    expectValid(fm.tba.release.main, { ...release, releaseType: 'boxset' }))
  it('rejects a datetime where a calendar date belongs', () =>
    expectRejectedAt(fm.tba.release.main, { ...release, releaseDate: TIMESTAMP }, ['releaseDate']))
  it('a split can name a band that has not claimed its entry', () =>
    expectValid(fm.tba.release.main, {
      ...release,
      releaseType: 'split',
      otherArtists: [{ name: 'Unclaimed Split Partner' }, { name: 'Claimed Band', did: BAND_DID }],
    }))
})

describe('event + lineup + confirm', () => {
  const event = {
    $type: 'community.lexicon.calendar.event',
    name: 'Example Band + support',
    startsAt: '2027-01-15T19:00:00.000Z',
    mode: 'community.lexicon.calendar.event#inperson',
    status: 'community.lexicon.calendar.event#scheduled',
    locations: [
      {
        $type: 'community.lexicon.location.geo',
        name: 'Some Venue',
        latitude: '60.3913',
        longitude: '5.3221',
      },
    ],
    uris: [{ uri: 'https://venue.example/calendar/123', name: 'Tickets' }],
    createdAt: TIMESTAMP,
  }
  const lineup = {
    $type: 'fm.tba.lineup',
    subject: EVENT_URI,
    artists: [
      { artist: { name: 'Example Band', did: BAND_DID }, role: 'headliner' },
      { artist: { name: 'Unclaimed Openers', externalIds: [{ source: 'musicbrainz', id: MUSICBRAINZ_ARTIST_ID }] }, role: 'support' },
    ],
    genres: ['black metal'],
    source: 'https://venue.example/calendar/123',
    createdAt: TIMESTAMP,
  }
  const confirm = {
    $type: 'fm.tba.eventConfirm',
    subject: { uri: EVENT_URI, cid: EVENT_CID },
    verdict: fm.tba.eventConfirm.Confirmed,
    createdAt: TIMESTAMP,
  }

  it('the shared event record validates', () => expectValid(community.lexicon.calendar.event.main, event))

  it('a lineup can list an unclaimed band with no DID', () => expectValid(fm.tba.lineup.main, lineup))

  it('a lineup needs at least one act', () =>
    expectRejectedAt(fm.tba.lineup.main, { ...lineup, artists: [] }, ['artists']))

  it('a lineup points at the event by plain URI, not a version-pinned strongRef', () =>
    expectRejectedAt(fm.tba.lineup.main, { ...lineup, subject: { uri: EVENT_URI, cid: EVENT_CID } }, ['subject']))

  it('a band confirmation pins the exact event version', () => expectValid(fm.tba.eventConfirm.main, confirm))

  it('a confirmation without a CID is rejected', () =>
    expectRejectedAt(fm.tba.eventConfirm.main, { ...confirm, subject: { uri: EVENT_URI } }, ['subject']))

  it('a public RSVP uses the shared rsvp record', () =>
    expectValid(community.lexicon.calendar.rsvp.main, {
      $type: 'community.lexicon.calendar.rsvp',
      subject: { uri: EVENT_URI, cid: EVENT_CID },
      status: 'community.lexicon.calendar.rsvp#going',
    }))
})
