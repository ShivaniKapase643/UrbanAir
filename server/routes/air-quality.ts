import { Router } from 'express'
import { citySchema, latLonSchema, validateQuery } from '../middleware/validation.js'
import { TtlCache } from '../services/cache.js'

const GEOCODING_HOST = 'geocoding-api.open-meteo.com'
const AIR_QUALITY_HOST = 'air-quality-api.open-meteo.com'
const UPSTREAM_TIMEOUT_MS = 8_000
const CACHE_TTL_MS = 10 * 60 * 1000

export const airQualityRouter = Router()
const cache = new TtlCache<unknown>(CACHE_TTL_MS)
const allowedHosts = new Set([GEOCODING_HOST, AIR_QUALITY_HOST])

async function fetchAllowed(url: URL): Promise<Response> {
  if (!allowedHosts.has(url.hostname)) {
    throw new Error('Unapproved upstream host')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
  } finally {
    clearTimeout(timeout)
  }
}

function createGeocodingUrl(name: string): URL {
  const url = new URL(`https://${GEOCODING_HOST}/v1/search`)
  url.searchParams.set('name', name)
  url.searchParams.set('count', '8')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')
  return url
}

function createAirQualityUrl(latitude: number, longitude: number): URL {
  const url = new URL(`https://${AIR_QUALITY_HOST}/v1/air-quality`)
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('current', 'european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide')
  url.searchParams.set('hourly', 'european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide')
  url.searchParams.set('forecast_days', '2')
  url.searchParams.set('timezone', 'auto')
  return url
}

airQualityRouter.get('/geocoding', validateQuery(citySchema), async (req, res, next) => {
  try {
    const { name } = res.locals.validatedQuery as { name: string }
    const cacheKey = `geo:${name.toLowerCase()}`
    const cachedResponse = cache.get(cacheKey)

    if (cachedResponse) {
      res.json(cachedResponse)
      return
    }

    const upstream = await fetchAllowed(createGeocodingUrl(name))

    if (!upstream.ok) {
      throw new Error('Geocoding unavailable')
    }

    const data = await upstream.json() as { results?: unknown[] }
    cache.set(cacheKey, data)
    res.json(data)
  } catch (error) {
    next(error)
  }
})

airQualityRouter.get('/coordinates', validateQuery(latLonSchema), async (req, res, next) => {
  try {
    const { latitude, longitude } = res.locals.validatedQuery as { latitude: number; longitude: number }
    const cacheKey = `aq:${latitude.toFixed(3)},${longitude.toFixed(3)}`
    const cachedResponse = cache.get(cacheKey)

    if (cachedResponse) {
      res.json(cachedResponse)
      return
    }

    const upstream = await fetchAllowed(createAirQualityUrl(latitude, longitude))

    if (!upstream.ok) {
      throw new Error('Air quality unavailable')
    }

    const data = await upstream.json()
    cache.set(cacheKey, data)
    res.json(data)
  } catch (error) {
    next(error)
  }
})
