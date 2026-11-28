import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

const serviceMocks = vi.hoisted(() => ({
  searchCities: vi.fn(),
  getCoordinates: vi.fn(),
}))

vi.mock('../src/services/air-quality-api', () => serviceMocks)

describe('city search regressions', () => {
  beforeEach(() => {
    serviceMocks.searchCities.mockReset()
    serviceMocks.getCoordinates.mockReset()
  })

  it('does not search while the city input is empty', async () => {
    render(<App />)

    await waitFor(() => {
      expect(serviceMocks.searchCities).not.toHaveBeenCalled()
    })
  })

  it('shows an API failure from city search', async () => {
    serviceMocks.searchCities.mockRejectedValue(new Error('City search failed.'))
    render(<App />)

    await userEvent.type(screen.getByLabelText(/city name/i), 'Chicago')

    expect(await screen.findByRole('alert')).toHaveTextContent('City search failed.')
  })

  it('cancels a stale repeated search request', async () => {
    const firstControllerSignal: AbortSignal[] = []

    serviceMocks.searchCities.mockImplementation(async (_name: string, signal: AbortSignal) => {
      firstControllerSignal.push(signal)
      return [{ name: 'Chicago', latitude: 41.88, longitude: -87.63, country: 'United States' }]
    })

    render(<App />)
    const input = screen.getByLabelText(/city name/i)

    await userEvent.type(input, 'Ch')
    await waitFor(() => expect(serviceMocks.searchCities).toHaveBeenCalledTimes(1))

    await userEvent.type(input, 'i')
    await waitFor(() => expect(serviceMocks.searchCities).toHaveBeenCalledTimes(2))

    expect(firstControllerSignal).toHaveLength(2)
    expect(firstControllerSignal[0].aborted).toBe(true)
  })
})
