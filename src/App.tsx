import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Pollutants } from './components/Pollutants'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { getCoordinates, searchCities } from './services/air-quality-api'
import { readClientCache, writeClientCache } from './services/client-cache'
import type { AdviceProfile, AirQualityData, Location } from './types/air-quality'
import { getAdvice } from './utils/advice'
import { getAqiCategory } from './utils/aqi'

const ForecastChart = lazy(() => import('./components/ForecastChart').then((module) => ({ default: module.ForecastChart })))

const DEFAULT_PROFILE: AdviceProfile = {
  jogging: false,
  kids: false,
  asthma: false,
  elderly: false,
  commuting: false,
}

function formatProfileLabel(profileKey: keyof AdviceProfile): string {
  if (profileKey === 'kids') {
    return 'Kids'
  }

  return profileKey.charAt(0).toUpperCase() + profileKey.slice(1)
}

function App() {
  const [query, setQuery] = useState('')
  const [compareQuery, setCompareQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Location[]>([])
  const [compareSuggestions, setCompareSuggestions] = useState<Location[]>([])
  const [primary, setPrimary] = useState<AirQualityData | null>(null)
  const [secondary, setSecondary] = useState<AirQualityData | null>(null)
  const [profile, setProfile] = useState<AdviceProfile>(DEFAULT_PROFILE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const debouncedCompare = useDebouncedValue(compareQuery, 300)

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) { setSuggestions([]); return }
    const controller = new AbortController()
    searchCities(debouncedQuery, controller.signal).then((results) => {
      setSuggestions(results)
      if (results.length === 0) setStatus(`No cities found for “${debouncedQuery.trim()}”`)
      else setStatus('')
    }).catch((cause: unknown) => {
      if (!(cause instanceof DOMException && cause.name === 'AbortError')) {
        setError(cause instanceof Error ? cause.message : 'City search failed.')
      }
    })
    return () => controller.abort()
  }, [debouncedQuery])

  useEffect(() => {
    if (debouncedCompare.trim().length < 2) { setCompareSuggestions([]); return }
    const controller = new AbortController()
    searchCities(debouncedCompare, controller.signal).then(setCompareSuggestions).catch(() => setCompareSuggestions([]))
    return () => controller.abort()
  }, [debouncedCompare])

  const loadLocation = useCallback(async (location: Location, isComparison = false) => {
    setLoading(true)
    setError('')
    setStatus(`Loading air quality for ${location.name}`)
    const controller = new AbortController()
    const cacheKey = `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)},${location.name}`
    const cached = readClientCache<AirQualityData>(cacheKey)
    try {
      const data = cached ?? await getCoordinates(location.latitude, location.longitude, controller.signal, location.name)
      if (!cached) writeClientCache(cacheKey, data)
      if (isComparison) {
        setSecondary(data)
        setCompareQuery(location.name)
        setCompareSuggestions([])
      } else {
        setPrimary(data)
        setQuery(location.name)
        setSuggestions([])
      }
      setStatus(`Air quality loaded for ${location.name}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load air quality. Check your connection.')
      setStatus('')
    } finally { setLoading(false) }
  }, [])

  const requestGeolocation = useCallback(() => {
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
  }, [loadLocation])

  const handleCityInput = useCallback((value: string) => {
    setQuery(value)
    setError('')
    setStatus('')
  }, [])

  const handleCompareInput = useCallback((value: string) => {
    setCompareQuery(value)
  }, [])

  const handleProfileChange = useCallback((profileKey: keyof AdviceProfile, checked: boolean) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [profileKey]: checked,
    }))
  }, [])

  const advice = useMemo(() => {
    if (!primary) {
      return []
    }

    return getAdvice(primary.current.aqi, profile)
  }, [primary, profile])

  const category = primary ? getAqiCategory(primary.current.aqi) : null

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header"><div><p className="eyebrow">Urban Air Quality</p><h1>Know the air around you</h1></div></header>
      <main id="main-content">
        <section className="search-panel" aria-labelledby="search-heading">
          <h2 id="search-heading">Check a city</h2>
          <div className="search-row">
            <div className="field">
              <label htmlFor="city-search">City name</label>
              <input
                id="city-search"
                value={query}
                onChange={(event) => handleCityInput(event.target.value)}
                placeholder="e.g. Chicago"
                autoComplete="off"
              />
            </div>
            <button type="button" className="secondary" onClick={requestGeolocation}>
              Use my location
            </button>
          </div>
          {suggestions.length > 0 && <ul className="suggestions" aria-label="City results">{suggestions.map((location) => <li key={`${location.latitude}-${location.longitude}`}><button type="button" onClick={() => void loadLocation(location)}>{location.name}{location.country ? `, ${location.country}` : ''}</button></li>)}</ul>}
          <div className="live-status" role="status" aria-live="polite">{loading ? 'Loading…' : status}</div>
          {error && <p className="error" role="alert">{error}</p>}
        </section>

        {primary ? (
          <div className="dashboard">
            <section className="aqi-card" aria-labelledby="current-heading">
              <p id="current-heading" className="location-name">{primary.location.name}</p>
              <div className="aqi-reading"><strong>{primary.current.aqi}</strong><span>European AQI</span></div>
              {category && <div className="category" style={{ borderColor: category.color }}><span aria-hidden="true">{category.icon}</span><div><h2>{category.name}</h2><p>{category.explanation}</p></div></div>}
              <Pollutants values={primary.current} />
            </section>

            <section className="advice-card" aria-labelledby="advice-heading">
              <h2 id="advice-heading">Personalised advice</h2>
              <fieldset><legend>Who is this for?</legend>
                {(Object.keys(DEFAULT_PROFILE) as Array<keyof AdviceProfile>).map((profileKey) => (
                  <label className="check" key={profileKey}>
                    <input
                      type="checkbox"
                      checked={profile[profileKey]}
                      onChange={(event) => handleProfileChange(profileKey, event.target.checked)}
                    />
                    <span>{formatProfileLabel(profileKey)}</span>
                  </label>
                ))}
              </fieldset>
              <ul>{advice.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>

            <Suspense fallback={<p role="status">Loading forecast chart…</p>}><ForecastChart hourly={primary.hourly} /></Suspense>

            <section className="compare-panel" aria-labelledby="compare-heading">
              <h2 id="compare-heading">Compare two cities</h2>
              <div className="search-row">
                <div className="field">
                  <label htmlFor="compare-city">Second city</label>
                  <input
                    id="compare-city"
                    value={compareQuery}
                    onChange={(event) => handleCompareInput(event.target.value)}
                    placeholder="e.g. London"
                  />
                </div>
              </div>
              {compareSuggestions.length > 0 && <ul className="suggestions" aria-label="Comparison city results">{compareSuggestions.map((location) => <li key={`${location.latitude}-${location.longitude}`}><button type="button" onClick={() => void loadLocation(location, true)}>{location.name}{location.country ? `, ${location.country}` : ''}</button></li>)}</ul>}
              {secondary && <div className="comparison"><article><h3>{primary.location.name}</h3><strong>{primary.current.aqi}</strong><span>{getAqiCategory(primary.current.aqi).name}</span></article><article><h3>{secondary.location.name}</h3><strong>{secondary.current.aqi}</strong><span>{getAqiCategory(secondary.current.aqi).name}</span></article></div>}
            </section>
          </div>
        ) : (
          <section className="empty-state" aria-label="No city selected"><h2>Start with a city or your location</h2><p>Live readings and a 48-hour trend will appear here.</p></section>
        )}
      </main>
    </>
  )
}

export default App
