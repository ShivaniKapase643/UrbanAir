import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from '../src/App'

vi.mock('../src/services/air-quality-api', () => ({
  searchCities: vi.fn(async (name: string) => {
    if (name.toLowerCase().startsWith('lon')) {
      return [{ name: 'London', latitude: 51.51, longitude: -0.12, country: 'United Kingdom' }]
    }
    return [{ name: 'Chicago', latitude: 41.88, longitude: -87.63, country: 'United States' }]
  }),
  getCoordinates: vi.fn(async (latitude: number, longitude: number, _signal: AbortSignal, name: string) => ({
    location: { name, latitude, longitude },
    timezone: 'UTC',
    current: { aqi: name === 'London' ? 55 : 42, pm2_5: 10, pm10: 20, nitrogen_dioxide: 5, ozone: 30, sulphur_dioxide: 2, carbon_monoxide: 100 },
    hourly: [],
  })),
}))

function setGeolocation(value: Geolocation | undefined): void {
  Object.defineProperty(window.navigator, 'geolocation', { configurable: true, value })
}

describe('location and comparison', () => {
  it('grants browser geolocation and loads the current location', async () => {
    setGeolocation({
      getCurrentPosition(success) {
        success({ coords: { latitude: 41.88, longitude: -87.63, accuracy: 1, altitude: null, altitudeAccuracy: null, heading: null, speed: null, toJSON: () => ({}) }, timestamp: 0, toJSON: () => ({}) } as GeolocationPosition)
      },
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }))
    expect(await screen.findByText('Good')).toBeInTheDocument()
  })

  it('handles denied browser geolocation gracefully', async () => {
    setGeolocation({
      getCurrentPosition(_success, error) {
        error?.({ code: 1, message: 'Permission denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
      },
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/permission was denied/i)
  })

  it('handles unsupported browser geolocation gracefully', async () => {
    setGeolocation(undefined)
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/not supported/i)
  })

  it('handles geolocation timeout gracefully', async () => {
    setGeolocation({
      getCurrentPosition(_success, error) {
        error?.({ code: 3, message: 'Location timeout', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)
      },
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /use my location/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/permission was denied/i)
  })

  it('compares two cities side by side', async () => {
    setGeolocation(undefined)
    render(<App />)
    await userEvent.type(screen.getByLabelText(/city name/i), 'Chi')
    await userEvent.click(await screen.findByRole('button', { name: /Chicago/i }))
    await screen.findByText('Good')

    await userEvent.type(screen.getByLabelText(/second city/i), 'Lon')
    await userEvent.click(await screen.findByRole('button', { name: /London/i }))

    expect(await screen.findByRole('heading', { name: 'London' })).toBeInTheDocument()
  })
})
