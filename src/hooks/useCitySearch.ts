import { useCallback, useEffect, useState } from 'react'
import { searchCities } from '../services/air-quality-api'
import type { Location } from '../types/air-quality'
import { useDebouncedValue } from './useDebouncedValue'

export interface CitySearchState {
  query: string
  setQuery: (value: string) => void
  suggestions: Location[]
  clearSuggestions: () => void
}

/** Manages debounced city search and request cancellation. */
export function useCitySearch(
  onError: (message: string) => void,
  onStatus: (message: string) => void,
): CitySearchState {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Location[]>([])
  const debouncedQuery = useDebouncedValue(query, 300)

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()

    void searchCities(debouncedQuery, controller.signal)
      .then((results) => {
        setSuggestions(results)
        if (results.length === 0) {
          onStatus(`No cities found for “${debouncedQuery.trim()}”`)
        } else {
          onStatus('')
        }
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
          onError(cause instanceof Error ? cause.message : 'City search failed.')
        }
      })

    return () => controller.abort()
  }, [debouncedQuery, onError, onStatus])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  return {
    query,
    setQuery,
    suggestions,
    clearSuggestions,
  }
}
