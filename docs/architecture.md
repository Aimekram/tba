# Architecture

How TBA is built and why. Decisions recorded 2026-11-21.

These are current defaults, not fixed choices. New argument or fact → reopen the decision, update this doc, say why in the commit. "Checked" and "tested" claims are as of 2026-11-21; re-check them later, many atproto packages are 0.x.

## Repo layout

pnpm workspace; the root holds only config.

```
apps/web/          Vite + React PWA
apps/server/       one Node service (below)
packages/lexicons/ schemas, generated types, record checks
packages/core/     trust rules as tested functions (once the indexer needs them)
```

Both apps import `@tba/lexicons`, so browser and server validate records with the same code.

## The server

One process, four modules (`auth/`, `api/`, `indexer/`, `feed/`), so the indexer can split off later:

1. **Login:** Bluesky OAuth (`@atproto/oauth-client-node`). The browser gets a session cookie, never Bluesky tokens.
2. **API** for the web app.
3. **Indexer:** keeps the index current.
4. **Feed generator:** the "TBA Metal" feed for Bluesky. The only endpoint that must be public.

Catalogue import code (MusicBrainz, venue iCal) lives in `import/`, the only place a catalogue is named.

## Data flow

- **Writes** go to the author's PDS via OAuth (web → server → PDS). Records live in the band's or seeder's account.
- **Reads** come from our index: PDS → Jetstream → indexer → SQLite → API → web.
- **Bluesky** calls our `app.bsky.feed.getFeedSkeleton` and gets post IDs.

## The index: small, rebuildable, never the master copy

- **Why:** atproto has no cross-account query. Without an index, "gigs in the city" means one request per PDS per page load, reverse lookups ("lineups for this event") are impossible, and the feed can't answer fast.
- **Scope:** directory accounts only (claimed bands, the seeder, linked Bluesky accounts of unclaimed bands). Jetstream filtered by DID, plus a `listRecords` backfill on claim.
- **Not copied:** fans' follows, names, avatars, posts. Read live from Bluesky's AppView.
- **Our database:** (a) copies of public records, rebuildable anytime; (b) private data that exists only here (sessions, watches, attendance). Only (b) needs backups, and (b) is the sensitive part.

## Ethos commitments

Indexing public data is how atproto works; the author owns the original. So:

1. Deletes and edits apply as they arrive. Deleted means removed, not hidden.
2. Index only: never the only copy of a user's data. Private data is exportable and deletable by its owner.
3. Used only for TBA's features. No selling, AI training or fan profiling. Honour atproto data-reuse intents if standardised.
4. Only directory accounts are indexed. Bands are removed on request.

These also go on the public methodology page.

## Stack decisions

| Area | Call | Why | Revisit if |
|---|---|---|---|
| Runtime | Node 24 LTS | `lex install` crashes on Node 23 (checked) | Node 26 is LTS and supported by atproto packages |
| Data fetching | TanStack Query | Cursor-paged feeds, optimistic watch/follow, refetch on focus, offline cache | The app turns out mostly static |
| Routing | TanStack Router (lean) | Typed URL filters, loaders that preload Query; keeps TanStack Start open | It fights Vite/PWA; fallback React Router |
| Link previews | Server injects OG tags for shareable URLs | Crawlers don't run JS; a few lines vs a server-rendering framework | Search traffic to band pages matters → TanStack Start for web + separate indexer service |
| Server framework | Hono + `@atproto/lex-server` at `/xrpc/*` | Typed, auto-validated XRPC from our lexicons (tested together). Not TanStack Start: the indexer needs a long-running process | lex-server's API changes (0.x); fallback Express + `toRequestListener` |
| Not `@atproto/xrpc-server` | | Legacy, Express-based, superseded by lex-server (older tutorials still use it) | |
| API style | **Open, decide before building the API.** Lean: XRPC lexicons | Types from the `lex` pipeline; other apps can query TBA's index | Lexicon work slows the first API too much → plain JSON + Hono client |
| Database | SQLite | Free, simple, enough for one city. Index is rebuildable | Distance radar needs PostGIS, or attendance raises backup stakes → hosted Postgres |
| Query layer | Kysely | Typed SQL, same code on SQLite and Postgres. Bluesky's PDS, AppView and Statusphere all use it (checked) | Unlikely |
| Supabase | Not now | Auth can't do atproto OAuth; functions can't hold Jetstream open. Only its Postgres fits | We move to hosted Postgres |

Don't enter gigs through a database dashboard: gigs are records in the seeder's account, and the index is rebuilt from them.

Lexicon formats and generated code: [`packages/lexicons/README.md`](../packages/lexicons/README.md). If decisions start changing often, switch to one decision record per file in `docs/decisions/`.
