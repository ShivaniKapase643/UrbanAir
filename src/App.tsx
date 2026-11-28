import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { AdvicePanel } from './components/AdvicePanel'
import { AqiSummary } from './components/AqiSummary'
import { CityComparison } from './components/CityComparison'
import { SearchPanel } from './components/SearchPanel'
import { useAirQuality } from './hooks/useAirQuality'
import { useCitySearch } from './hooks/useCitySearch'
import { useGeolocation } from './hooks/useGeolocation'
import type { AdviceProfile, Location } from './types/air-quality'
import { getAdvice } from './utils/advice'
import { getAqiCategory } from './utils/aqi'

const ForecastChart = lazy(() =>
  import('./components/ForecastChart').then((module) => ({
    default: module.ForecastChart,
  })),
)

const DEFAULT_PROFILE: AdviceProfile = {
  jogging: false,
  kids: false,
  asthma: false,
  elderly: false,
  commuting: false,
}

function App() {
  const airQuality = useAirQuality()
  const [profile, setProfile] = useState<AdviceProfile>(DEFAULT_PROFILE)

  const handleSearchError = useCallback((message: string) => {
    airQuality.setError(message)
  }, [airQuality.setError])

  const handleSearchStatus = useCallback((message: string) => {
    airQuality.setStatus(message)
  }, [airQuality.setStatus])

  const handleComparisonStatus = useCallback(() => undefined, [])

  const citySearch = useCitySearch(handleSearchError, handleSearchStatus)
  const comparisonSearch = useCitySearch(handleSearchError, handleComparisonStatus)

  const handlePrimaryLocation = useCallback((location: Location) => {
    void airQuality.loadLocation(location)
    citySearch.setQuery(location.name)
    citySearch.clearSuggestions()
  }, [airQuality.loadLocation, citySearch])

  const handleComparisonLocation = useCallback((location: Location) => {
    void airQuality.loadLocation(location, true)
    comparisonSearch.setQuery(location.name)
    comparisonSearch.clearSuggestions()
  }, [airQuality.loadLocation, comparisonSearch])

  const handleCityInput = useCallback((value: string) => {
    citySearch.setQuery(value)
    airQuality.clearError()
    airQuality.clearStatus()
  }, [airQuality.clearError, airQuality.clearStatus, citySearch])

  const handleProfileChange = useCallback((profileKey: keyof AdviceProfile, checked: boolean) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [profileKey]: checked,
    }))
  }, [])

  const requestGeolocation = useGeolocation({
    setLoading: airQuality.setLoading,
    setError: airQuality.setError,
    setStatus: airQuality.setStatus,
    loadLocation: airQuality.loadLocation,
  })

  const advice = useMemo(() => {
    if (!airQuality.primary) {
      return []
    }

    return getAdvice(airQuality.primary.current.aqi, profile)
  }, [airQuality.primary, profile])

  const category = airQuality.primary
    ? getAqiCategory(airQuality.primary.current.aqi)
    : null

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <div>
          <p className="eyebrow">Urban Air Quality</p>
          <h1>Know the air around you</h1>
        </div>
      </header>

      <main id="main-content">
        <SearchPanel
          query={citySearch.query}
          suggestions={citySearch.suggestions}
          loading={airQuality.loading}
          status={airQuality.status}
          error={airQuality.error}
          onQueryChange={handleCityInput}
          onRequestLocation={requestGeolocation}
          onSelectLocation={handlePrimaryLocation}
        />

        {airQuality.primary && category ? (
          <div className="dashboard">
            <AqiSummary data={airQuality.primary} category={category} />

            <AdvicePanel
              advice={advice}
              profile={profile}
              onProfileChange={handleProfileChange}
            />

            <Suspense fallback={<p role="status">Loading forecast chart…</p>}>
              <ForecastChart hourly={airQuality.primary.hourly} />
            </Suspense>

            <CityComparison
              primary={airQuality.primary}
              secondary={airQuality.secondary}
              query={comparisonSearch.query}
              suggestions={comparisonSearch.suggestions}
              onQueryChange={comparisonSearch.setQuery}
              onSelectLocation={handleComparisonLocation}
            />
          </div>
        ) : (
          <section className="empty-state" aria-label="No city selected">
            <h2>Start with a city or your location</h2>
            <p>Live readings and a 48-hour trend will appear here.</p>
          </section>
        )}
      </main>
    </>
  )
}

export default App
