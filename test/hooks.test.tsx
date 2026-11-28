import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAirQuality } from '../src/hooks/useAirQuality'
import { useCitySearch } from '../src/hooks/useCitySearch'

const getCoordinates = vi.hoisted(() => vi.fn())
const searchCities = vi.hoisted(() => vi.fn())

vi.mock('../src/services/air-quality-api', () => ({
  getCoordinates,
  searchCities,
}))

describe('useAirQuality', () => {
  beforeEach(() => {
    localStorage.clear()
    getCoordinates.mockReset()
  })

  it('loads primary and comparison locations', async () => {
    getCoordinates.mockImplementation(async (
      latitude: number,
      longitude: number,
      _signal: AbortSignal,
      name: string,
    ) => ({
      location: { name, latitude, longitude },
      timezone: 'UTC',
      current: { aqi: 42, pm2_5: 10, pm10: 20, nitrogen_dioxide: 5, ozone: 30, sulphur_dioxide: 2, carbon_monoxide: 100 },
      hourly: [],
    }))

    const { result } = renderHook(() => useAirQuality())

    await act(async () => {
      await result.current.loadLocation({ name: 'Chicago', latitude: 41.88, longitude: -87.63 })
    })

    expect(result.current.primary?.location.name).toBe('Chicago')

    await act(async () => {
      await result.current.loadLocation({ name: 'London', latitude: 51.51, longitude: -0.12 }, true)
    })

    expect(result.current.secondary?.location.name).toBe('London')
  })

  it('handles load failures safely', async () => {
    getCoordinates.mockRejectedValue(new Error('Upstream unavailable'))
    const { result } = renderHook(() => useAirQuality())

    await act(async () => {
      await result.current.loadLocation({ name: 'Chicago', latitude: 41.88, longitude: -87.63 })
    })

    expect(result.current.error).toBe('Upstream unavailable')
    expect(result.current.status).toBe('')
  })

  it('uses a cached location without calling the API', async () => {
    localStorage.setItem('urban-air:41.880,-87.630,Chicago', JSON.stringify({
      value: {
        location: { name: 'Chicago', latitude: 41.88, longitude: -87.63 },
        timezone: 'UTC',
        current: { aqi: 42, pm2_5: 10, pm10: 20, nitrogen_dioxide: 5, ozone: 30, sulphur_dioxide: 2, carbon_monoxide: 100 },
        hourly: [],
      },
      expiresAt: Date.now() + 60000,
    }))

    const { result } = renderHook(() => useAirQuality())

    await act(async () => {
      await result.current.loadLocation({ name: 'Chicago', latitude: 41.88, longitude: -87.63 })
    })

    expect(getCoordinates).not.toHaveBeenCalled()
    expect(result.current.primary?.location.name).toBe('Chicago')
  })

  it('handles unknown load failures with fallback text', async () => {
    getCoordinates.mockRejectedValue('unstructured failure')
    const { result } = renderHook(() => useAirQuality())

    await act(async () => {
      await result.current.loadLocation({ name: 'Chicago', latitude: 41.88, longitude: -87.63 })
    })

    expect(result.current.error).toBe('Could not load air quality. Check your connection.')
  })
})

describe('useCitySearch', () => {
  beforeEach(() => {
    searchCities.mockReset()
  })

  it('loads suggestions and clears status', async () => {
    searchCities.mockResolvedValue([{ name: 'Chicago', latitude: 41.88, longitude: -87.63 }])
    const onError = vi.fn()
    const onStatus = vi.fn()
    const { result } = renderHook(() => useCitySearch(onError, onStatus))

    act(() => result.current.setQuery('Chi'))

    await waitFor(() => {
      expect(result.current.suggestions).toHaveLength(1)
    })

    expect(onStatus).toHaveBeenCalledWith('')
  })

  it('reports empty search results', async () => {
    searchCities.mockResolvedValue([])
    const onError = vi.fn()
    const onStatus = vi.fn()
    const { result } = renderHook(() => useCitySearch(onError, onStatus))

    act(() => result.current.setQuery('Nowhere'))

    await waitFor(() => {
      expect(onStatus).toHaveBeenCalledWith('No cities found for “Nowhere”')
    })
  })

  it('does not search for short city input', async () => {
    const onError = vi.fn()
    const onStatus = vi.fn()
    const { result } = renderHook(() => useCitySearch(onError, onStatus))

    act(() => result.current.setQuery('A'))

    await waitFor(() => {
      expect(searchCities).not.toHaveBeenCalled()
    })
  })

  it('reports city-search API failures', async () => {
    searchCities.mockRejectedValue(new Error('City search failed'))
    const onError = vi.fn()
    const onStatus = vi.fn()
    const { result } = renderHook(() => useCitySearch(onError, onStatus))

    act(() => result.current.setQuery('Chicago'))

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('City search failed')
    })
  })
})
