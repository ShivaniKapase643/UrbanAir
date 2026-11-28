import { useCallback } from 'react'
import type { Location } from '../types/air-quality'

interface GeolocationActions {
  setLoading: (loading: boolean) => void
  setError: (error: string) => void
  setStatus: (status: string) => void
  loadLocation: (location: Location) => Promise<void>
}

/** Requests browser geolocation while preserving existing user-facing errors. */
export function useGeolocation(actions: GeolocationActions): () => void {
  const { setLoading, setError, setStatus, loadLocation } = actions

  return useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('')
      setError('Geolocation is not supported by this browser.')
      return
    }

    setLoading(true)
    setError('')
    setStatus('Waiting for location permission…')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadLocation({
          name: 'Your location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        setLoading(false)
        setStatus('')
        setError('Location permission was denied. Search for a city instead.')
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      },
    )
  }, [setLoading, setError, setStatus, loadLocation])
}
