# AGENTS.md

TBA: a chronological, algorithm-free music-scene app (bands, releases, gigs) on atproto. Design and reasons: [`docs/architecture.md`](docs/architecture.md).

## Commands

- Node 24+ (`.nvmrc`); Node 23 breaks `lex install`. pnpm workspace.
- `pnpm install` regenerates lexicon types.
- `pnpm test` · `pnpm typecheck` · `pnpm check` (vendored lexicons match their pins; needs network). CI runs all three on every PR.
- Add a published lexicon: `pnpm --filter @tba/lexicons install-lexicons <nsid>`

## Never

- Edit `packages/lexicons/lexicons/vendor/` (fetched) or `packages/lexicons/src/lexicons/` (generated).
- Put our lexicons in `vendor/`: `lex install` deletes unlisted files there.
- Commit `SCOPE.md`, `.env` or secrets.
- Name a catalogue in a record format: use `externalIds`. Catalogue code lives only in the server's `import/`; the app never calls a catalogue live.
- Use MusicBrainz tags or genre votes (CC BY-NC-SA). Only its CC0 core data is usable.

## Easy to get wrong

- Record trust rules live in each lexicon's `description`. Don't restate them elsewhere.
- Never order by `createdAt` or use it for "latest wins": the writer sets it. Use `sortAt` (earlier of `createdAt` and index time) or commit order.
- Genres must pass `isKnownGenre`; release dates must pass `parseReleaseDate`. Lexicons can't enforce either.
- Deletes remove data from the index, not hide it. Don't index fans. Private data stays server-side and is exportable and deletable by its owner.
- Credit MusicBrainz wherever its data is shown.

## Decisions are revisable

If a task conflicts with `docs/architecture.md`, or you find a fact that undermines a decision there, say so and recommend before proceeding. Don't follow it blindly; don't silently deviate.

## Docs

- Rules and reasons, not progress. No "what exists" or milestones: the tree and git show that. Open questions are conditions ("before building the API"). Dated checks are fine.
- Update a doc in the same commit as the change it describes.

## Code style

- Descriptive names over comments: rename instead of explaining (`expectRejectedAt`, not `bad` + a comment). Comment only what code can't show: a non-obvious why, a trap, an external fact.
- TypeScript, ESM, `.ts` import extensions (Node runs source via type stripping).
- vitest in each package's `test/`. Negative validation tests assert the failing path.
