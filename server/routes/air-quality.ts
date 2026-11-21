import { Router } from 'express'
import { citySchema, latLonSchema, validateQuery } from '../middleware/validation.js'
import { TtlCache } from '../services/cache.js'

export const airQualityRouter = Router()
const cache = new TtlCache<unknown>(10 * 60 * 1000)
const ALLOWED_HOSTS = new Set(['geocoding-api.open-meteo.com', 'air-quality-api.open-meteo.com'])

async function fetchAllowed(url: URL, signal?: AbortSignal): Promise<Response> {
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error('Unapproved upstream host')
  return fetch(url, { signal, headers: { Accept: 'application/json' } })
}

airQualityRouter.get('/geocoding', validateQuery(citySchema), async (req, res, next) => {
  try {
    const { name } = res.locals.validatedQuery as { name: string }
    const key = `geo:${name.toLowerCase()}`
    const cached = cache.get(key)
    if (cached) { res.json(cached); return }
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
    url.searchParams.set('name', name)
    url.searchParams.set('count', '8')
    url.searchParams.set('language', 'en')
    url.searchParams.set('format', 'json')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const upstream = await fetchAllowed(url, controller.signal)
    clearTimeout(timer)
    if (!upstream.ok) throw new Error('Geocoding unavailable')
    const data = await upstream.json() as { results?: unknown[] }
    cache.set(key, data)
    res.json(data)
  } catch (error) { next(error) }
})

airQualityRouter.get('/coordinates', validateQuery(latLonSchema), async (req, res, next) => {
  try {
    const { latitude, longitude } = res.locals.validatedQuery as { latitude: number; longitude: number }
    const key = `aq:${latitude.toFixed(3)},${longitude.toFixed(3)}`
    const cached = cache.get(key)
    if (cached) { res.json(cached); return }
    const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality')
    url.searchParams.set('latitude', String(latitude))
    url.searchParams.set('longitude', String(longitude))
    url.searchParams.set('current', 'european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide')
    url.searchParams.set('hourly', 'european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide')
    url.searchParams.set('forecast_days', '2')
    url.searchParams.set('timezone', 'auto')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const upstream = await fetchAllowed(url, controller.signal)
    clearTimeout(timer)
    if (!upstream.ok) throw new Error('Air quality unavailable')
    const data = await upstream.json()
    cache.set(key, data)
    res.json(data)
  } catch (error) { next(error) }
})
