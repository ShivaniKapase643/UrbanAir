import type { AqiCategory, AirQualityData } from '../types/air-quality'
import { Pollutants } from './Pollutants'

interface Props {
  data: AirQualityData
  category: AqiCategory
}

export function AqiSummary({ data, category }: Props) {
  return (
    <section className="aqi-card" aria-labelledby="current-heading">
      <p id="current-heading" className="location-name">{data.location.name}</p>
      <div className="aqi-reading">
        <strong>{data.current.aqi}</strong>
        <span>European AQI</span>
      </div>
      <div className="category" style={{ borderColor: category.color }}>
        <span aria-hidden="true">{category.icon}</span>
        <div>
          <h2>{category.name}</h2>
          <p>{category.explanation}</p>
        </div>
      </div>
      <Pollutants values={data.current} />
    </section>
  )
}
