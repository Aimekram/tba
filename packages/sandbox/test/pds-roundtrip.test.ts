import { TestNetworkNoAppView } from '@atproto/dev-env'
import { AtUri } from '@atproto/syntax'
import { community, fm } from '@tba/lexicons'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAccount, type SandboxAccount } from '../src/accounts.ts'

const TIMESTAMP = '2026-11-21T20:00:00.000Z'

let network: TestNetworkNoAppView
let band: SandboxAccount
let seeder: SandboxAccount

beforeAll(async () => {
  network = await TestNetworkNoAppView.create({})
  band = await createAccount(network.pds.url, 'band')
  seeder = await createAccount(network.pds.url, 'seeder')
}, 60_000)

afterAll(async () => {
  await network?.close()
})

describe('a real PDS and our lexicons', () => {
  it('stores an invalid record unvalidated, so the indexer must validate everything it reads', async () => {
    const missingTitle = { $type: 'fm.tba.release', releaseType: 'album', createdAt: TIMESTAMP } as const
    const stored = await band.client.createRecord(missingTitle)
    expect(stored.body.validationStatus).toBe('unknown')
    expect(fm.tba.release.main.safeParse(missingTitle).success).toBe(false)
  })

  it('refuses explicit validation for a lexicon it does not know', async () => {
    const attempt = band.client.create(
      fm.tba.release,
      { title: 'Debut', releaseType: 'album', releaseDate: '2027', createdAt: TIMESTAMP },
      { validate: true },
    )
    await expect(attempt).rejects.toThrow('Unknown lexicon type: fm.tba.release')
  })

  it("an event edit keeps its URI but changes its CID, so a confirmation's CID pins the version it confirmed", async () => {
    const event = await seeder.client.create(community.lexicon.calendar.event, {
      name: 'Example Band + support',
      startsAt: '2027-01-15T19:00:00.000Z',
      createdAt: TIMESTAMP,
    })
    const edited = await seeder.client.put(
      community.lexicon.calendar.event,
      { name: 'Example Band + support', startsAt: '2027-01-16T19:00:00.000Z', createdAt: TIMESTAMP },
      { rkey: new AtUri(event.uri).rkey },
    )
    expect(edited.uri).toBe(event.uri)
    expect(edited.cid).not.toBe(event.cid)
  })
})
