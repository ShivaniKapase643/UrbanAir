import type { Location } from '../types/air-quality'

interface Props {
  query: string
  suggestions: Location[]
  loading: boolean
  status: string
  error: string
  onQueryChange: (value: string) => void
  onRequestLocation: () => void
  onSelectLocation: (location: Location) => void
}

export function SearchPanel({
  query,
  suggestions,
  loading,
  status,
  error,
  onQueryChange,
  onRequestLocation,
  onSelectLocation,
}: Props) {
  return (
    <section className="search-panel" aria-labelledby="search-heading">
      <h2 id="search-heading">Check a city</h2>
      <div className="search-row">
        <div className="field">
          <label htmlFor="city-search">City name</label>
          <input
            id="city-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="e.g. Chicago"
            autoComplete="off"
          />
        </div>
        <button type="button" className="secondary" onClick={onRequestLocation}>
          Use my location
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul className="suggestions" aria-label="City results">
          {suggestions.map((location) => (
            <li key={`${location.latitude}-${location.longitude}`}>
              <button type="button" onClick={() => onSelectLocation(location)}>
                {location.name}{location.country ? `, ${location.country}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="live-status" role="status" aria-live="polite">
        {loading ? 'Loading…' : status}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}
