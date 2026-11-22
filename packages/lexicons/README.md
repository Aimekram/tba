# @tba/lexicons

TBA's record schemas plus the shared ones it reuses, with generated TypeScript types and validators.

```
lexicons/
  fm/tba/        ← ours, hand-written (DRAFT, M0)
  vendor/        ← fetched by `lex install`, committed. Never edit, never put our files here
lexicons.json    ← manifest + pinned CIDs for vendor/
vocab/
  genres.json    ← TBA's genre vocabulary. Ours: edit here (sorted, lowercase; a test enforces it)
src/
  lexicons/      ← generated, gitignored. Rebuilt on install, test and typecheck
  *.ts           ← hand-written checks the schemas can't express (releaseDate.ts, genres.ts)
```

**No catalogue lock-in:** record formats never name a specific catalogue. Use `externalIds: [{ source, id }]` for MusicBrainz/Discogs/Wikidata ids. Catalogue-specific code belongs in import/seeding code, not here.

**Requires Node 24+.** `lex install` crashes on Node 23 (undici incompatibility).

**`lex install` deletes every file in its target folder that isn't in the manifest.** That's why the install script points at `lexicons/vendor` and our own files live outside it.

This follows the layout of Bluesky's own repos (`@atproto/api`, statusphere-example-app): fetched lexicon JSON is committed so CI needs no network; generated TypeScript is not committed and is regenerated before use.

| Command | Does |
|---|---|
| `pnpm install-lexicons <nsid>` | Fetch a published lexicon (e.g. `app.bsky.graph.follow`) into `vendor/` |
| `pnpm build` | Regenerate `src/lexicons/`. Runs automatically on `pnpm install`, `test` and `typecheck` |
| `pnpm test` | Validate sample records against the schemas; unit-test `parseReleaseDate` and the genre vocabulary |
| `pnpm typecheck` | Type-check sources and tests (vitest doesn't) |
| `pnpm check` | For CI: fails if a vendored lexicon changed upstream (CID pins). Needs network |

## Records

**The rules for each record (who may write it, when consumers should trust it, which record wins) are in that record's `description` in [`lexicons/fm/tba/`](lexicons/fm/tba/).** That file is the source of truth; this table is only an index.

| NSID | Written by |
|---|---|
| [`fm.tba.defs`](lexicons/fm/tba/defs.json) | n/a (shared types `link`, `externalId`, `artistRef`) |
| [`fm.tba.artist`](lexicons/fm/tba/artist.json) | Band |
| [`fm.tba.release`](lexicons/fm/tba/release.json) | Band |
| [`fm.tba.lineup`](lexicons/fm/tba/lineup.json) | Event's author or TBA seeder |
| [`fm.tba.eventConfirm`](lexicons/fm/tba/eventConfirm.json) | Band on the lineup (v0.5) |
| `community.lexicon.calendar.event` / `.rsvp` | Anyone (shared formats, reused as-is) |

`fm.tba.*` is a placeholder namespace. Rename everything once the product name and domain are final. Fanclub records are deferred to v0.5 and not drafted yet.
