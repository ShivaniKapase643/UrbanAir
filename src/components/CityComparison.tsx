import type { AirQualityData, Location } from '../types/air-quality'
import { getAqiCategory } from '../utils/aqi'

interface Props {
  primary: AirQualityData
  secondary: AirQualityData | null
  query: string
  suggestions: Location[]
  onQueryChange: (value: string) => void
  onSelectLocation: (location: Location) => void
}

export function CityComparison({
  primary,
  secondary,
  query,
  suggestions,
  onQueryChange,
  onSelectLocation,
}: Props) {
  return (
    <section className="compare-panel" aria-labelledby="compare-heading">
      <h2 id="compare-heading">Compare two cities</h2>
      <div className="search-row">
        <div className="field">
          <label htmlFor="compare-city">Second city</label>
          <input
            id="compare-city"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="e.g. London"
          />
        </div>
      </div>

      {suggestions.length > 0 && (
        <ul className="suggestions" aria-label="Comparison city results">
          {suggestions.map((location) => (
            <li key={`${location.latitude}-${location.longitude}`}>
              <button type="button" onClick={() => onSelectLocation(location)}>
                {location.name}{location.country ? `, ${location.country}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}

      {secondary && (
        <div className="comparison">
          <article>
            <h3>{primary.location.name}</h3>
            <strong>{primary.current.aqi}</strong>
            <span>{getAqiCategory(primary.current.aqi).name}</span>
          </article>
          <article>
            <h3>{secondary.location.name}</h3>
            <strong>{secondary.current.aqi}</strong>
            <span>{getAqiCategory(secondary.current.aqi).name}</span>
          </article>
        </div>
      )}
    </section>
  )
}
