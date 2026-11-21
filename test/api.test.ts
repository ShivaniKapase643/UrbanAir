import { afterEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { app } from '../server/index'

afterEach(() => vi.restoreAllMocks())

describe('Air quality API', () => {
  it('returns health with security headers', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(response.headers['permissions-policy']).toContain('geolocation=(self)')
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(response.headers['x-content-type-options']).toBe('nosniff')
  })
  it('rejects bad coordinates', async () => { const response = await request(app).get('/api/air-quality/coordinates?latitude=91&longitude=0'); expect(response.status).toBe(400) })
  it('rejects malformed city', async () => { const response = await request(app).get('/api/air-quality/geocoding?name=%3Cscript%3E'); expect(response.status).toBe(400) })
  it('handles upstream failure safely', async () => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 }))); const response = await request(app).get('/api/air-quality/coordinates?latitude=40&longitude=-74'); expect(response.status).toBe(502); expect(response.body).not.toHaveProperty('stack') })
})
