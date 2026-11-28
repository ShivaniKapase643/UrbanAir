import { useCallback, useState } from 'react'
import { getCoordinates } from '../services/air-quality-api'
import { readClientCache, writeClientCache } from '../services/client-cache'
import type { AirQualityData, Location } from '../types/air-quality'

export interface AirQualityState {
  primary: AirQualityData | null
  secondary: AirQualityData | null
  loading: boolean
  error: string
  status: string
  clearError: () => void
  clearStatus: () => void
  setStatus: (status: string) => void
  setError: (error: string) => void
  setLoading: (loading: boolean) => void
  loadLocation: (location: Location, isComparison?: boolean) => Promise<void>
}

/** Loads primary or comparison air-quality data and manages request status. */
export function useAirQuality(): AirQualityState {
  const [primary, setPrimary] = useState<AirQualityData | null>(null)
  const [secondary, setSecondary] = useState<AirQualityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const clearError = useCallback(() => setError(''), [])
  const clearStatus = useCallback(() => setStatus(''), [])

  const loadLocation = useCallback(async (location: Location, isComparison = false) => {
    setLoading(true)
    setError('')
    setStatus(`Loading air quality for ${location.name}`)

    const controller = new AbortController()
    const cacheKey = `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)},${location.name}`
    const cached = readClientCache<AirQualityData>(cacheKey)

    try {
      const data = cached ?? await getCoordinates(
        location.latitude,
        location.longitude,
        controller.signal,
        location.name,
      )

      if (!cached) {
        writeClientCache(cacheKey, data)
      }

      if (isComparison) {
        setSecondary(data)
      } else {
        setPrimary(data)
      }

      setStatus(`Air quality loaded for ${location.name}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load air quality. Check your connection.')
      setStatus('')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    primary,
    secondary,
    loading,
    error,
    status,
    clearError,
    clearStatus,
    setStatus,
    setError,
    setLoading,
    loadLocation,
  }
}
