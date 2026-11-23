import { TestNetworkNoAppView } from '@atproto/dev-env'
import { currentDatetimeString } from '@atproto/lex'
import { community, fm } from '@tba/lexicons'
import { createAccount } from './accounts.ts'

const PLC_PORT = 2582
const PDS_PORT = 2583
const TIMESTAMP = currentDatetimeString()

const network = await TestNetworkNoAppView.create({ plc: { port: PLC_PORT }, pds: { port: PDS_PORT } })
const pdsUrl = network.pds.url

const band = await createAccount(pdsUrl, 'band')
const fan = await createAccount(pdsUrl, 'fan')
const seeder = await createAccount(pdsUrl, 'seeder')

await band.client.put(fm.tba.artist, {
  name: 'Example Band',
  genres: ['black metal'],
  origin: 'Bergen, Norway',
  createdAt: TIMESTAMP,
})
const release = await band.client.create(fm.tba.release, {
  title: 'Debut',
  releaseType: 'album',
  releaseDate: '2027-03',
  createdAt: TIMESTAMP,
})

const event = await seeder.client.create(community.lexicon.calendar.event, {
  name: 'Example Band + support',
  startsAt: '2027-01-15T19:00:00.000Z',
  createdAt: TIMESTAMP,
})
await seeder.client.create(fm.tba.lineup, {
  subject: event.uri,
  artists: [
    { artist: { name: 'Example Band', did: band.did }, role: 'headliner' },
    { artist: { name: 'Unclaimed Openers' }, role: 'support' },
  ],
  createdAt: TIMESTAMP,
})

// A Bluesky lexicon the PDS knows, unlike fm.tba.*: compare validationStatus in the output.
const follow = await fan.client.createRecord({
  $type: 'app.bsky.graph.follow',
  subject: band.did,
  createdAt: TIMESTAMP,
})

const listRecordsCommand = (repo: string, collection: string) =>
  `curl -s '${pdsUrl}/xrpc/com.atproto.repo.listRecords?repo=${repo}&collection=${collection}'`

console.log(`
Local atproto sandbox (fresh data on every start)

  PDS  ${pdsUrl}
  PLC  ${network.plc.url}

  Accounts (handle / DID / password)
${[band, fan, seeder].map((account) => `    ${account.handle.padEnd(12)} ${account.did}  ${account.password}`).join('\n')}

  Seeded: band profile + release, an event with its lineup, fan follows band
  validationStatus: follow "${follow.body.validationStatus}", our release "${release.validationStatus}"

  Try:
    ${listRecordsCommand(band.handle, 'fm.tba.artist')}
    ${listRecordsCommand(seeder.handle, 'fm.tba.lineup')}
    curl -s '${pdsUrl}/xrpc/com.atproto.repo.describeRepo?repo=${band.handle}'

Ctrl+C to stop.
`)

const stop = async () => {
  await network.close()
  process.exit(0)
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
