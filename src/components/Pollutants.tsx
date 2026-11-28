import type { PollutantValues } from '../types/air-quality'

const POLLUTANT_LABELS: Array<[keyof Omit<PollutantValues, 'aqi'>, string, string]> = [
  ['pm2_5', 'PM2.5', 'µg/m³'],
  ['pm10', 'PM10', 'µg/m³'],
  ['nitrogen_dioxide', 'NO₂', 'µg/m³'],
  ['ozone', 'O₃', 'µg/m³'],
  ['sulphur_dioxide', 'SO₂', 'µg/m³'],
  ['carbon_monoxide', 'CO', 'µg/m³'],
]

export function Pollutants({ values }: { values: PollutantValues }) {
  return (
    <section aria-labelledby="pollutants-heading">
      <h2 id="pollutants-heading">Pollutants</h2>
      <dl className="pollutant-grid">
        {POLLUTANT_LABELS.map(([key, label, unit]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>
              {values[key].toFixed(1)} <span>{unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
