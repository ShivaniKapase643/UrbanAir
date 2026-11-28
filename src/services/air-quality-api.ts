import type { AirQualityData, Location, PollutantValues } from '../types/air-quality'

const API_BASE = '/api/air-quality'

interface GeocodingResponse {
  results?: Array<{
    name: string
    latitude: number
    longitude: number
    country?: string
  }>
}

interface AirQualityResponse {
  latitude: number
  longitude: number
  timezone: string
  current: Record<string, number>
  hourly: Record<string, Array<number | string>>
}

async function readJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Request failed.' })) as { error?: string }
    throw new Error(body.error ?? 'Request failed.')
  }

  return response.json() as Promise<T>
}

function mapSearchResults(data: GeocodingResponse): Location[] {
  if (!data.results) {
    return []
  }

  return data.results.map((item) => ({
    name: item.name,
    latitude: item.latitude,
    longitude: item.longitude,
    country: item.country,
  }))
}

function numberAt(values: Array<number | string> | undefined, index: number): number {
  return Number(values?.[index] ?? 0)
}

function mapHourlyValues(
  raw: AirQualityResponse,
  locationTime: string,
  index: number,
): PollutantValues & { time: string } {
  return {
    time: locationTime,
    aqi: numberAt(raw.hourly.european_aqi, index),
    pm2_5: numberAt(raw.hourly.pm2_5, index),
    pm10: numberAt(raw.hourly.pm10, index),
    nitrogen_dioxide: numberAt(raw.hourly.nitrogen_dioxide, index),
    ozone: numberAt(raw.hourly.ozone, index),
    sulphur_dioxide: numberAt(raw.hourly.sulphur_dioxide, index),
    carbon_monoxide: numberAt(raw.hourly.carbon_monoxide, index),
  }
}

function mapCurrentValues(raw: AirQualityResponse): PollutantValues {
  return {
    aqi: Number(raw.current.european_aqi ?? 0),
    pm2_5: Number(raw.current.pm2_5 ?? 0),
    pm10: Number(raw.current.pm10 ?? 0),
    nitrogen_dioxide: Number(raw.current.nitrogen_dioxide ?? 0),
    ozone: Number(raw.current.ozone ?? 0),
    sulphur_dioxide: Number(raw.current.sulphur_dioxide ?? 0),
    carbon_monoxide: Number(raw.current.carbon_monoxide ?? 0),
  }
}

/** Searches Open-Meteo geocoding for matching locations. */
export async function searchCities(name: string, signal: AbortSignal): Promise<Location[]> {
  const url = `${API_BASE}/geocoding?name=${encodeURIComponent(name)}`
  const data = await readJson<GeocodingResponse>(url, signal)
  return mapSearchResults(data)
}

/** Loads live and hourly air-quality values for a location. */
export async function getCoordinates(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
  locationName = 'Selected location',
): Promise<AirQualityData> {
  const url = `${API_BASE}/coordinates?latitude=${latitude}&longitude=${longitude}`
  const raw = await readJson<AirQualityResponse>(url, signal)
  const times = (raw.hourly.time ?? []) as string[]
  const hourly = times
    .slice(0, 48)
    .map((time, index) => mapHourlyValues(raw, time, index))

  return {
    location: {
      name: locationName,
      latitude: raw.latitude,
      longitude: raw.longitude,
    },
    timezone: raw.timezone,
    current: mapCurrentValues(raw),
    hourly,
  }
}
