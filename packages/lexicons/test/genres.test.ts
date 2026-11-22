import { describe, expect, it } from 'vitest'
import vocab from '../vocab/genres.json' with { type: 'json' }
import { GENRES, isKnownGenre, keepKnownGenres } from '../src/genres.ts'

describe('genre vocabulary file', () => {
  it('is sorted, unique, lowercase and trimmed (so diffs of additions stay readable)', () => {
    const sorted = [...vocab.genres].sort()
    expect(vocab.genres).toEqual(sorted)
    expect(GENRES.size).toBe(vocab.genres.length)
    for (const genre of vocab.genres) expect(genre, genre).toBe(genre.trim().toLowerCase())
  })

  it('covers the metal scene', () => {
    for (const genre of ['black metal', 'atmospheric black metal', 'doom metal', 'sludge metal', 'grindcore', 'blackgaze', 'dungeon synth'])
      expect(isKnownGenre(genre), genre).toBe(true)
  })
})

describe('isKnownGenre / keepKnownGenres', () => {
  it('is exact: no case or spelling variants', () => {
    expect(isKnownGenre('Black Metal')).toBe(false)
    expect(isKnownGenre('black-metal')).toBe(false)
  })

  it('drops non-genres and duplicates, keeps order', () =>
    expect(keepKnownGenres(['seen live', 'doom metal', 'black metal', 'doom metal', 'favourites'])).toEqual([
      'doom metal',
      'black metal',
    ]))
})
