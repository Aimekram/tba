// TBA's genre vocabulary (vocab/genres.json). Genre fields in fm.tba.* records
// must use these names exactly. Lexicons can't express an enumerated list this
// large, so writers and the indexer check it here.
import vocab from '../vocab/genres.json' with { type: 'json' }

export const GENRES: ReadonlySet<string> = new Set(vocab.genres)

/** True if `name` is in TBA's vocabulary, exactly as written there (lowercase). */
export const isKnownGenre = (name: string): boolean => GENRES.has(name)

/** Keeps only known genres, deduplicated, in input order. For indexing records written by any app. */
export const knownGenres = (names: readonly string[]): string[] => [
  ...new Set(names.filter(isKnownGenre)),
]
