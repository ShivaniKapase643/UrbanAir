import { describe, expect, it } from 'vitest'
import { TtlCache } from '../server/services/cache'

const shortTtlMs = 1
const normalTtlMs = 1000

describe('TtlCache', () => {
  it('stores and retrieves values', () => {
    const cache = new TtlCache<string>(normalTtlMs)

    cache.set('location', 'Chicago')

    expect(cache.get('location')).toBe('Chicago')
  })

  it('expires values', () => {
    const cache = new TtlCache<string>(shortTtlMs)
    cache.set('location', 'Chicago')

    expect(cache.get('location')).toBe('Chicago')

    return new Promise((resolve) => {
      setTimeout(() => {
        expect(cache.get('location')).toBeUndefined()
        resolve(undefined)
      }, 5)
    })
  })

  it('clears values', () => {
    const cache = new TtlCache<string>(normalTtlMs)
    cache.set('location', 'Chicago')

    cache.clear()

    expect(cache.get('location')).toBeUndefined()
  })
})
