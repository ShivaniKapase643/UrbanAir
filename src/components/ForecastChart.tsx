import type { PollutantValues } from '../types/air-quality'

interface Props {
  hourly: Array<PollutantValues & { time: string }>
}

const CHART_WIDTH = 640
const CHART_HEIGHT = 220
const CHART_PADDING = 28
const MARKER_INTERVAL = 6

function getChartMaximum(points: Array<PollutantValues & { time: string }>): number {
  return Math.max(100, ...points.map((point) => point.aqi))
}

function getChartPosition(
  index: number,
  pointCount: number,
  aqi: number,
  maximumAqi: number,
): { x: number; y: number } {
  const availableWidth = CHART_WIDTH - CHART_PADDING * 2
  const availableHeight = CHART_HEIGHT - CHART_PADDING * 2
  const denominator = Math.max(1, pointCount - 1)
  const x = CHART_PADDING + (index / denominator) * availableWidth
  const y = CHART_HEIGHT - CHART_PADDING - (aqi / maximumAqi) * availableHeight

  return { x, y }
}

export function ForecastChart({ hourly }: Props) {
  const points = hourly.slice(0, 48)
  const maximumAqi = getChartMaximum(points)
  const coordinates = points
    .map((point, index) => {
      const position = getChartPosition(index, points.length, point.aqi, maximumAqi)
      return `${position.x},${position.y}`
    })
    .join(' ')

  const markerPoints = points.filter((_, index) => index % MARKER_INTERVAL === 0)
  const chartDescription = `AQI trend chart. ${points.length} hourly readings from ${points[0]?.aqi ?? 0} to ${points.at(-1)?.aqi ?? 0}.`

  return (
    <section aria-labelledby="forecast-heading">
      <h2 id="forecast-heading">24–48 hour forecast</h2>
      <svg
        className="chart"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={chartDescription}
      >
        <polyline
          points={coordinates}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
        {markerPoints.map((point) => {
          const originalIndex = points.indexOf(point)
          const position = getChartPosition(originalIndex, points.length, point.aqi, maximumAqi)

          return (
            <circle
              key={point.time}
              cx={position.x}
              cy={position.y}
              r="4"
              fill="currentColor"
            />
          )
        })}
      </svg>
      <details>
        <summary>View hourly AQI data</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">AQI</th>
                <th scope="col">PM2.5</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.time}>
                  <td>{new Date(point.time).toLocaleString([], { weekday: 'short', hour: 'numeric' })}</td>
                  <td>{point.aqi}</td>
                  <td>{point.pm2_5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
