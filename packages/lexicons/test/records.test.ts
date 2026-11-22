import { describe, expect, it } from 'vitest'
import { community, fm } from '../src/lexicons/index.ts'

// Placeholder identifiers. Real ones come from the sandbox PDS.
const TBA_SEEDER = 'did:plc:tbaseederaaaaaaaaaaaaaaa'
const BAND = 'did:plc:bandaaaaaaaaaaaaaaaaaaaa'
const EVENT_URI = `at://${TBA_SEEDER}/community.lexicon.calendar.event/3lbtestevent22`
const EVENT_CID = 'bafyreigqh6tvhgfifv647ns2jck3gwe6hvmqsehbow7zuhoviwle2esysm' // any valid CID
const MBID = 'f59c5520-5f46-4d2c-b2c4-822eabf53419'
const now = '2026-11-21T20:00:00.000Z'

// Structural subset of @atproto/lex's ValidationResult. Missing keys are reported
// on the parent object's path (with `key` naming the missing one).
type Issue = { readonly path: readonly PropertyKey[] }
type Result = { readonly success: boolean; readonly issues?: readonly Issue[] }
type Schema = { safeParse: (v: unknown) => Result }

const ok = (schema: Schema, v: unknown) => {
  const result = schema.safeParse(v)
  expect(result.success, JSON.stringify(result)).toBe(true)
}

/** Asserts the record is rejected, and rejected at `path`, so a typo elsewhere can't make it pass. */
const bad = (schema: Schema, v: unknown, path: PropertyKey[]) => {
  const result = schema.safeParse(v)
  expect(result.success).toBe(false)
  expect(result.issues?.map((i) => i.path), JSON.stringify(result)).toContainEqual(path)
}

describe('fm.tba.artist', () => {
  const artist = {
    $type: 'fm.tba.artist',
    name: 'Example Band',
    genres: ['black metal', 'atmospheric'],
    origin: 'Bergen, Norway',
    links: [{ uri: 'https://example.bandcamp.com', kind: 'bandcamp' }],
    externalIds: [{ source: 'musicbrainz', id: MBID }],
    createdAt: now,
  }
  it('accepts a profile', () => ok(fm.tba.artist.main, artist))
  it('accepts ids from catalogues TBA has not listed (open knownValues)', () =>
    ok(fm.tba.artist.main, { ...artist, externalIds: [{ source: 'metal-archives', id: '3540' }] }))
  it('an external id needs a source', () =>
    bad(fm.tba.artist.main, { ...artist, externalIds: [{ id: MBID }] }, ['externalIds', 0]))
  it('requires a name', () => bad(fm.tba.artist.main, { ...artist, name: undefined }, ['name']))
  it('caps genre tags at 10', () =>
    bad(fm.tba.artist.main, { ...artist, genres: Array(11).fill('doom') }, ['genres']))
  it('rejects non-URI links', () =>
    bad(fm.tba.artist.main, { ...artist, links: [{ uri: 'not a url' }] }, ['links', 0, 'uri']))
})

describe('fm.tba.release', () => {
  const release = {
    $type: 'fm.tba.release',
    title: 'Debut',
    releaseType: 'album',
    releaseDate: '2027-02-13',
    createdAt: now,
  }
  it('accepts an announced (future) album', () => ok(fm.tba.release.main, release))
  it('accepts year-only and month-only announcements', () => {
    ok(fm.tba.release.main, { ...release, releaseDate: '2027' })
    ok(fm.tba.release.main, { ...release, releaseDate: '2027-03' })
  })
  it('accepts a release type TBA has not listed yet (open knownValues)', () =>
    ok(fm.tba.release.main, { ...release, releaseType: 'boxset' }))
  it('rejects a datetime where a calendar date belongs', () =>
    bad(fm.tba.release.main, { ...release, releaseDate: now }, ['releaseDate']))
  it('a split can name a band that has not claimed its entry', () =>
    ok(fm.tba.release.main, {
      ...release,
      releaseType: 'split',
      otherArtists: [{ name: 'Unclaimed Split Partner' }, { name: 'Claimed Band', did: BAND }],
    }))
})

describe('event + lineup + confirm (SCOPE M0 step 4)', () => {
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
    createdAt: now,
  }
  const lineup = {
    $type: 'fm.tba.lineup',
    subject: EVENT_URI,
    artists: [
      { artist: { name: 'Example Band', did: BAND }, role: 'headliner' },
      { artist: { name: 'Unclaimed Openers', externalIds: [{ source: 'musicbrainz', id: MBID }] }, role: 'support' },
    ],
    genres: ['black metal'],
    source: 'https://venue.example/calendar/123',
    createdAt: now,
  }
  const confirm = {
    $type: 'fm.tba.eventConfirm',
    subject: { uri: EVENT_URI, cid: EVENT_CID },
    verdict: fm.tba.eventConfirm.Confirmed,
    createdAt: now,
  }

  it('the shared event record validates', () => ok(community.lexicon.calendar.event.main, event))

  it('a lineup can list an unclaimed band with no DID', () => ok(fm.tba.lineup.main, lineup))

  it('a lineup needs at least one act', () =>
    bad(fm.tba.lineup.main, { ...lineup, artists: [] }, ['artists']))

  it('a lineup points at the event by plain URI, not a version-pinned strongRef', () =>
    bad(fm.tba.lineup.main, { ...lineup, subject: { uri: EVENT_URI, cid: EVENT_CID } }, ['subject']))

  it('a band confirmation pins the exact event version', () => ok(fm.tba.eventConfirm.main, confirm))

  it('a confirmation without a CID is rejected', () =>
    bad(fm.tba.eventConfirm.main, { ...confirm, subject: { uri: EVENT_URI } }, ['subject']))

  it('a public RSVP uses the shared rsvp record', () =>
    ok(community.lexicon.calendar.rsvp.main, {
      $type: 'community.lexicon.calendar.rsvp',
      subject: { uri: EVENT_URI, cid: EVENT_CID },
      status: 'community.lexicon.calendar.rsvp#going',
    }))
})
