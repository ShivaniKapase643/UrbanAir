import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, expect, it } from 'vitest'
import { Pollutants } from '../src/components/Pollutants'
import { ForecastChart } from '../src/components/ForecastChart'

describe('main components', () => {
  it('displays pollutant values accessibly', async () => { const { container } = render(<Pollutants values={{ aqi: 20, pm2_5: 4, pm10: 8, nitrogen_dioxide: 3, ozone: 20, sulphur_dioxide: 1, carbon_monoxide: 200 }} />); expect(screen.getByText('PM2.5')).toBeInTheDocument(); const results = await axe(container); expect(results.violations).toHaveLength(0) })
  it('provides a chart text alternative', () => { render(<ForecastChart hourly={Array.from({ length: 24 }, (_, i) => ({ time: `2026-11-21T${i}:00`, aqi: i + 20, pm2_5: 4, pm10: 8, nitrogen_dioxide: 3, ozone: 20, sulphur_dioxide: 1, carbon_monoxide: 200 }))} />); expect(screen.getByText(/view hourly aqi data/i)).toBeInTheDocument(); expect(screen.getByRole('img')).toBeInTheDocument() })
  it('renders safely with no forecast points', () => { render(<ForecastChart hourly={[]} />); expect(screen.getByRole('img')).toBeInTheDocument() })
})
