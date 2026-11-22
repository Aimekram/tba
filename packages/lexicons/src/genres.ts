// Lexicons can't enumerate a list this large, so genre fields are checked against the vocabulary here.
import vocab from '../vocab/genres.json' with { type: 'json' }

export const GENRES: ReadonlySet<string> = new Set(vocab.genres)

export const isKnownGenre = (name: string): boolean => GENRES.has(name)

export const keepKnownGenres = (names: readonly string[]): string[] => [
  ...new Set(names.filter(isKnownGenre)),
]
