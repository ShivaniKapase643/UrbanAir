export type AqiCategoryName = 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous'

export interface AqiCategory {
  name: AqiCategoryName
  min: number
  max: number
  icon: '●' | '!'
  explanation: string
  color: string
}

export interface PollutantValues {
  aqi: number
  pm2_5: number
  pm10: number
  nitrogen_dioxide: number
  ozone: number
  sulphur_dioxide: number
  carbon_monoxide: number
}

export interface Location {
  name: string
  latitude: number
  longitude: number
  country?: string
}

export interface AirQualityData {
  location: Location
  current: PollutantValues
  hourly: Array<PollutantValues & { time: string }>
  timezone: string
}

export interface AdviceProfile {
  jogging: boolean
  kids: boolean
  asthma: boolean
  elderly: boolean
  commuting: boolean
}

export interface ApiError { error: string }
