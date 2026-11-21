import { describe, expect, it } from 'vitest'
import { citySchema, latLonSchema } from '../server/middleware/validation'

describe('input validation', () => {
  it('accepts valid cities and coordinates', () => { expect(citySchema.safeParse({ name: 'St. Louis' }).success).toBe(true); expect(latLonSchema.safeParse({ latitude: 38.6, longitude: -90.2 }).success).toBe(true) })
  it('rejects malformed cities', () => { expect(citySchema.safeParse({ name: '<script>' }).success).toBe(false); expect(citySchema.safeParse({ name: 'A' }).success).toBe(false) })
  it('rejects out-of-range coordinates', () => { expect(latLonSchema.safeParse({ latitude: 91, longitude: 0 }).success).toBe(false); expect(latLonSchema.safeParse({ latitude: 0, longitude: 181 }).success).toBe(false) })
})
