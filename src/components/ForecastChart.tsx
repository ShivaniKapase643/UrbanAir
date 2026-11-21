import type { PollutantValues } from '../types/air-quality'

interface Props { hourly: Array<PollutantValues & { time: string }> }

export function ForecastChart({ hourly }: Props) {
  const points = hourly.slice(0, 48)
  const width = 640
  const height = 220
  const padding = 28
  const max = Math.max(100, ...points.map((point) => point.aqi))
  const min = 0
  const coordinates = points.map((point, index) => {
    const x = padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2)
    const y = height - padding - ((point.aqi - min) / (max - min)) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')
  return (
    <section aria-labelledby="forecast-heading">
      <h2 id="forecast-heading">24–48 hour forecast</h2>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`AQI trend chart. ${points.length} hourly readings from ${points[0]?.aqi ?? 0} to ${points.at(-1)?.aqi ?? 0}.`}>
        <polyline points={coordinates} fill="none" stroke="currentColor" strokeWidth="4" />
        {points.filter((_, index) => index % 6 === 0).map((point, index) => (
          <circle key={point.time} cx={padding + (index * 6 / Math.max(1, points.length - 1)) * (width - padding * 2)} cy={height - padding - ((point.aqi - min) / (max - min)) * (height - padding * 2)} r="4" fill="currentColor" />
        ))}
      </svg>
      <details>
        <summary>View hourly AQI data</summary>
        <div className="table-wrap"><table><thead><tr><th scope="col">Time</th><th scope="col">AQI</th><th scope="col">PM2.5</th></tr></thead><tbody>{points.map((point) => <tr key={point.time}><td>{new Date(point.time).toLocaleString([], { weekday: 'short', hour: 'numeric' })}</td><td>{point.aqi}</td><td>{point.pm2_5}</td></tr>)}</tbody></table></div>
      </details>
    </section>
  )
}
