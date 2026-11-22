import { describe, expect, it } from 'vitest'
import vocab from '../vocab/genres.json' with { type: 'json' }
import { GENRES, isKnownGenre, knownGenres } from '../src/genres.ts'

describe('genre vocabulary file', () => {
  it('is sorted, unique, lowercase and trimmed (so diffs of additions stay readable)', () => {
    const sorted = [...vocab.genres].sort()
    expect(vocab.genres).toEqual(sorted)
    expect(GENRES.size).toBe(vocab.genres.length)
    for (const g of vocab.genres) expect(g, g).toBe(g.trim().toLowerCase())
  })

  it('covers the metal scene', () => {
    for (const g of ['black metal', 'atmospheric black metal', 'doom metal', 'sludge metal', 'grindcore', 'blackgaze', 'dungeon synth'])
      expect(isKnownGenre(g), g).toBe(true)
  })
})

describe('isKnownGenre / knownGenres', () => {
  it('is exact: no case or spelling variants', () => {
    expect(isKnownGenre('Black Metal')).toBe(false)
    expect(isKnownGenre('black-metal')).toBe(false)
  })

  it('drops non-genres and duplicates, keeps order', () =>
    expect(knownGenres(['seen live', 'doom metal', 'black metal', 'doom metal', 'favourites'])).toEqual([
      'doom metal',
      'black metal',
    ]))
})
