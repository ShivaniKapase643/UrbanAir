import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { AdvicePanel } from '../src/components/AdvicePanel'
import { AqiSummary } from '../src/components/AqiSummary'
import { CityComparison } from '../src/components/CityComparison'
import { ForecastChart } from '../src/components/ForecastChart'
import { Pollutants } from '../src/components/Pollutants'
import { SearchPanel } from '../src/components/SearchPanel'

const profile = {
  jogging: false,
  kids: false,
  asthma: false,
  elderly: false,
  commuting: false,
}

const airQualityData = {
  location: { name: 'Chicago', latitude: 41.88, longitude: -87.63 },
  timezone: 'UTC',
  current: {
    aqi: 42,
    pm2_5: 10,
    pm10: 20,
    nitrogen_dioxide: 5,
    ozone: 30,
    sulphur_dioxide: 2,
    carbon_monoxide: 100,
  },
  hourly: [],
}

describe('main components', () => {
  it('displays pollutant values accessibly', async () => {
    const { container } = render(
      <Pollutants values={{ aqi: 20, pm2_5: 4, pm10: 8, nitrogen_dioxide: 3, ozone: 20, sulphur_dioxide: 1, carbon_monoxide: 200 }} />,
    )

    expect(screen.getByText('PM2.5')).toBeInTheDocument()
    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })

  it('provides a chart text alternative', () => {
    render(<ForecastChart hourly={Array.from({ length: 24 }, (_, i) => ({ time: `2026-11-21T${i}:00`, aqi: i + 20, pm2_5: 4, pm10: 8, nitrogen_dioxide: 3, ozone: 20, sulphur_dioxide: 1, carbon_monoxide: 200 }))} />)

    expect(screen.getByText(/view hourly aqi data/i)).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('renders safely with no forecast points', () => {
    render(<ForecastChart hourly={[]} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('renders search status, suggestions, and input controls', async () => {
    const onQueryChange = vi.fn()
    const onRequestLocation = vi.fn()
    const onSelectLocation = vi.fn()

    render(
      <SearchPanel
        query="Chi"
        suggestions={[{ name: 'Chicago', latitude: 41.88, longitude: -87.63, country: 'US' }]}
        loading
        status=""
        error="Search unavailable"
        onQueryChange={onQueryChange}
        onRequestLocation={onRequestLocation}
        onSelectLocation={onSelectLocation}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /use my location/i }))
    await userEvent.click(screen.getByRole('button', { name: /Chicago/i }))

    expect(onRequestLocation).toHaveBeenCalledOnce()
    expect(onSelectLocation).toHaveBeenCalledWith(expect.objectContaining({ name: 'Chicago' }))
  })

  it('renders advice profiles and handles profile selection', async () => {
    const onProfileChange = vi.fn()

    render(
      <AdvicePanel
        advice={["Outdoor activity is generally okay."]}
        profile={profile}
        onProfileChange={onProfileChange}
      />,
    )

    await userEvent.click(screen.getByRole('checkbox', { name: 'Kids' }))

    expect(onProfileChange).toHaveBeenCalledWith('kids', true)
  })

  it('renders AQI summary and comparison content', () => {
    render(
      <AqiSummary
        data={airQualityData}
        category={{
          name: 'Good',
          min: 0,
          max: 50,
          icon: '●',
          explanation: 'Air quality is satisfactory for most people.',
          color: '#166534',
        }}
      />,
    )

    expect(screen.getByText('Chicago')).toBeInTheDocument()

    render(
      <CityComparison
        primary={airQualityData}
        secondary={null}
        query=""
        suggestions={[]}
        onQueryChange={vi.fn()}
        onSelectLocation={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Compare two cities' })).toBeInTheDocument()
  })
})
