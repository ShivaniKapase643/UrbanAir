import { beforeEach, describe, expect, it } from 'vitest'
import { TtlCache } from '../server/services/cache'

describe('TtlCache', () => {
  beforeEach(() => {})
  it('stores and retrieves values', () => { const cache = new TtlCache<string>(1000); cache.set('x','value'); expect(cache.get('x')).toBe('value') })
  it('expires values', () => { const cache = new TtlCache<string>(1); cache.set('x','value'); expect(cache.get('x')).toBe('value'); return new Promise((resolve) => setTimeout(() => { expect(cache.get('x')).toBeUndefined(); resolve(undefined) }, 5)) })
  it('clears values', () => { const cache = new TtlCache<string>(1000); cache.set('x','value'); cache.clear(); expect(cache.get('x')).toBeUndefined() })
})
