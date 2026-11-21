import type { AirQualityData, Location } from '../types/air-quality'

const API_BASE = '/api/air-quality'

async function readJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Request failed.' })) as { error?: string }
    throw new Error(body.error ?? 'Request failed.')
  }
  return response.json() as Promise<T>
}

export async function searchCities(name: string, signal: AbortSignal): Promise<Location[]> {
  const data = await readJson<{ results?: Array<{ name: string; latitude: number; longitude: number; country?: string }> }>(`${API_BASE}/geocoding?name=${encodeURIComponent(name)}`, signal)
  return data.results?.map((item) => ({ name: item.name, latitude: item.latitude, longitude: item.longitude, country: item.country })) ?? []
}

export async function getCoordinates(latitude: number, longitude: number, signal: AbortSignal, locationName = 'Selected location'): Promise<AirQualityData> {
  const raw = await readJson<{ latitude: number; longitude: number; timezone: string; current: Record<string, number>; hourly: Record<string, Array<number | string>> }>(`${API_BASE}/coordinates?latitude=${latitude}&longitude=${longitude}`, signal)
  const times = (raw.hourly.time ?? []) as string[]
  const hourly = times.slice(0, 48).map((time, index) => ({
    time,
    aqi: Number(raw.hourly.european_aqi?.[index] ?? 0),
    pm2_5: Number(raw.hourly.pm2_5?.[index] ?? 0),
    pm10: Number(raw.hourly.pm10?.[index] ?? 0),
    nitrogen_dioxide: Number(raw.hourly.nitrogen_dioxide?.[index] ?? 0),
    ozone: Number(raw.hourly.ozone?.[index] ?? 0),
    sulphur_dioxide: Number(raw.hourly.sulphur_dioxide?.[index] ?? 0),
    carbon_monoxide: Number(raw.hourly.carbon_monoxide?.[index] ?? 0),
  }))
  return {
    location: { name: locationName, latitude: raw.latitude, longitude: raw.longitude },
    timezone: raw.timezone,
    current: {
      aqi: Number(raw.current.european_aqi ?? 0), pm2_5: Number(raw.current.pm2_5 ?? 0), pm10: Number(raw.current.pm10 ?? 0),
      nitrogen_dioxide: Number(raw.current.nitrogen_dioxide ?? 0), ozone: Number(raw.current.ozone ?? 0), sulphur_dioxide: Number(raw.current.sulphur_dioxide ?? 0), carbon_monoxide: Number(raw.current.carbon_monoxide ?? 0),
    }, hourly,
  }
}
