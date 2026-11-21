import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import App from '../src/App'

vi.mock('../src/services/air-quality-api', () => ({
  searchCities: vi.fn(async () => [{ name: 'Chicago', latitude: 41.88, longitude: -87.63, country: 'United States' }]),
  getCoordinates: vi.fn(async (_lat: number, _lon: number, _signal: AbortSignal, name: string) => ({ location: { name, latitude: _lat, longitude: _lon }, timezone: 'UTC', current: { aqi: 42, pm2_5: 10, pm10: 20, nitrogen_dioxide: 5, ozone: 30, sulphur_dioxide: 2, carbon_monoxide: 100 }, hourly: Array.from({ length: 48 }, (_, i) => ({ time: new Date(Date.UTC(2026,10,21,0) + i * 3600000).toISOString(), aqi: 42 + i % 5, pm2_5: 10, pm10: 20, nitrogen_dioxide: 5, ozone: 30, sulphur_dioxide: 2, carbon_monoxide: 100 })) }))
}))

describe('Urban Air Assistant', () => {
  it('renders empty state and search', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /start with a city/i })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/city name/i), 'Chi')
  })
  it('loads and displays a city result', async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText(/city name/i), 'Chi')
    await screen.findByRole('button', { name: /Chicago/i })
    await userEvent.click(screen.getByRole('button', { name: /Chicago/i }))
    expect(await screen.findByText('Good')).toBeInTheDocument()
  })
  it('has no detectable accessibility violations', async () => {
    const { container } = render(<App />)
    const results = await axe(container)
    if (results.violations.length) throw new Error(results.violations.map((violation) => `${violation.id}: ${violation.help}`).join('\n'))
  })
})
