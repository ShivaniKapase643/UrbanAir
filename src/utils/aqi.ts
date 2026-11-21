import type { AqiCategory } from '../types/air-quality'

export const AQI_CATEGORIES: readonly AqiCategory[] = [
  { name: 'Good', min: 0, max: 50, icon: '●', explanation: 'Air quality is satisfactory for most people.', color: '#166534' },
  { name: 'Moderate', min: 51, max: 100, icon: '●', explanation: 'Sensitive people may want to reduce prolonged outdoor exertion.', color: '#8a5a00' },
  { name: 'Unhealthy for Sensitive Groups', min: 101, max: 150, icon: '!', explanation: 'Children, older adults, and people with lung conditions should reduce outdoor activity.', color: '#9a3412' },
  { name: 'Unhealthy', min: 151, max: 200, icon: '!', explanation: 'Everyone should reduce long or intense outdoor activity.', color: '#991b1b' },
  { name: 'Very Unhealthy', min: 201, max: 300, icon: '!', explanation: 'Avoid outdoor exertion and consider staying indoors with filtered air.', color: '#6b21a8' },
  { name: 'Hazardous', min: 301, max: 500, icon: '!', explanation: 'Stay indoors when possible and follow local health guidance.', color: '#7f1d1d' },
]

/** Returns an accessible, plain-language AQI category for a non-negative AQI value. */
export function getAqiCategory(aqi: number): AqiCategory {
  const safeAqi = Number.isFinite(aqi) ? Math.max(0, Math.round(aqi)) : 0
  return AQI_CATEGORIES.find((category) => safeAqi >= category.min && safeAqi <= category.max)
    ?? AQI_CATEGORIES[AQI_CATEGORIES.length - 1]
}
