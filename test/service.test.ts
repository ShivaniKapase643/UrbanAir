import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCoordinates, searchCities } from '../src/services/air-quality-api'
import { readClientCache, writeClientCache } from '../src/services/client-cache'

const chicagoGeocodingResult = {
  results: [{
    name: 'Chicago',
    latitude: 41.8,
    longitude: -87.6,
    country: 'US',
  }],
}

const chicagoAirQualityResult = {
  latitude: 41.8,
  longitude: -87.6,
  timezone: 'America/Chicago',
  current: {
    european_aqi: 42,
    pm2_5: 4,
    pm10: 8,
    nitrogen_dioxide: 3,
    ozone: 20,
    sulphur_dioxide: 1,
    carbon_monoxide: 200,
  },
  hourly: {
    time: ['2026-11-21T00:00'],
    european_aqi: [42],
    pm2_5: [4],
    pm10: [8],
    nitrogen_dioxide: [3],
    ozone: [20],
    sulphur_dioxide: [1],
    carbon_monoxide: [200],
  },
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

describe('air quality services', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('maps city geocoding results', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(chicagoGeocodingResult)))

    const result = await searchCities('Chicago', new AbortController().signal)

    expect(result[0].name).toBe('Chicago')
  })

  it('returns an empty city result when upstream has no matches', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({})))

    expect(await searchCities('Nowhere', new AbortController().signal)).toEqual([])
  })

  it('maps Open-Meteo coordinates', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(chicagoAirQualityResult)))

    const result = await getCoordinates(41.8, -87.6, new AbortController().signal, 'Chicago')

    expect(result.location.name).toBe('Chicago')
    expect(result.hourly).toHaveLength(1)
  })

  it('maps missing coordinate values safely', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ current: {}, hourly: {} })))

    const result = await getCoordinates(0, 0, new AbortController().signal)

    expect(result.current.aqi).toBe(0)
    expect(result.hourly).toHaveLength(0)
  })

  it('throws a safe API error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'Unavailable' }, 503)))

    await expect(searchCities('Chicago', new AbortController().signal)).rejects.toThrow('Unavailable')
  })

  it('stores and retrieves client cache entries', () => {
    writeClientCache('test', { value: 1 })

    expect(readClientCache<{ value: number }>('test')).toEqual({ value: 1 })
  })

  it('handles missing, expired, and corrupted cache', () => {
    expect(readClientCache('missing')).toBeUndefined()

    localStorage.setItem('urban-air:bad', '{bad')
    expect(readClientCache('bad')).toBeUndefined()

    localStorage.setItem('urban-air:expired', JSON.stringify({ value: 1, expiresAt: 1 }))
    expect(readClientCache('expired')).toBeUndefined()
  })
})
