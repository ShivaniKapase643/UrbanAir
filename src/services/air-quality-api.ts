import type { AirQualityData, Location, PollutantValues } from '../types/air-quality'

const API_BASE = '/api/air-quality'

interface GeocodingResponse {
  results?: Location[]
}

interface AirQualityResponse {
  latitude: number
  longitude: number
  timezone: string
  current: Record<string, unknown>
  hourly: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function readPollutantArray(value: unknown): Array<number | string | null> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is number | string | null =>
    typeof item === 'number' || typeof item === 'string' || item === null,
  )
}

function isLocation(value: unknown): value is Location {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.name === 'string'
    && typeof value.latitude === 'number'
    && typeof value.longitude === 'number'
}

function validateGeocodingResponse(value: unknown): GeocodingResponse {
  if (!isRecord(value) || !Array.isArray(value.results)) {
    return {}
  }

  const results = value.results
    .filter(isLocation)
    .map((item) => ({
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: typeof item.country === 'string' ? item.country : undefined,
    }))

  return { results }
}

function validateAirQualityResponse(value: unknown): AirQualityResponse {
  if (!isRecord(value)) {
    return {
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
      current: {},
      hourly: { time: [] },
    }
  }

  return {
    latitude: readNumber(value.latitude),
    longitude: readNumber(value.longitude),
    timezone: typeof value.timezone === 'string' ? value.timezone : 'UTC',
    current: isRecord(value.current) ? value.current : {},
    hourly: isRecord(value.hourly) ? value.hourly : { time: [] },
  }
}

async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const unknownBody = await response.json().catch(() => ({ error: 'Request failed.' }))

    if (isRecord(unknownBody) && typeof unknownBody.error === 'string') {
      throw new Error(unknownBody.error)
    }

    throw new Error('Request failed.')
  }

  return response.json()
}

function mapSearchResults(data: GeocodingResponse): Location[] {
  return data.results ?? []
}

function numberAt(values: Array<number | string | null>, index: number): number {
  return readNumber(values[index])
}

function mapHourlyValues(
  raw: AirQualityResponse,
  locationTime: string,
  index: number,
): PollutantValues & { time: string } {
  return {
    time: locationTime,
    aqi: numberAt(readPollutantArray(raw.hourly.european_aqi), index),
    pm2_5: numberAt(readPollutantArray(raw.hourly.pm2_5), index),
    pm10: numberAt(readPollutantArray(raw.hourly.pm10), index),
    nitrogen_dioxide: numberAt(readPollutantArray(raw.hourly.nitrogen_dioxide), index),
    ozone: numberAt(readPollutantArray(raw.hourly.ozone), index),
    sulphur_dioxide: numberAt(readPollutantArray(raw.hourly.sulphur_dioxide), index),
    carbon_monoxide: numberAt(readPollutantArray(raw.hourly.carbon_monoxide), index),
  }
}

function mapCurrentValues(raw: AirQualityResponse): PollutantValues {
  return {
    aqi: readNumber(raw.current.european_aqi),
    pm2_5: readNumber(raw.current.pm2_5),
    pm10: readNumber(raw.current.pm10),
    nitrogen_dioxide: readNumber(raw.current.nitrogen_dioxide),
    ozone: readNumber(raw.current.ozone),
    sulphur_dioxide: readNumber(raw.current.sulphur_dioxide),
    carbon_monoxide: readNumber(raw.current.carbon_monoxide),
  }
}

/** Searches Open-Meteo geocoding for matching locations. */
export async function searchCities(name: string, signal: AbortSignal): Promise<Location[]> {
  const url = `${API_BASE}/geocoding?name=${encodeURIComponent(name)}`
  const unknownData = await readJson(url, signal)
  const data = validateGeocodingResponse(unknownData)
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
  const unknownData = await readJson(url, signal)
  const raw = validateAirQualityResponse(unknownData)
  const times = readStringArray(raw.hourly.time)
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
