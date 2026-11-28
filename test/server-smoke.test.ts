import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../server/index'

const distDirectory = path.resolve(process.cwd(), 'dist')

function findBuiltAsset(extension: '.js' | '.css'): string {
  const assetDirectory = path.join(distDirectory, 'assets')
  const fileName = readdirSync(assetDirectory).find((name) => name.endsWith(extension))

  if (!fileName) {
    throw new Error(`No built ${extension} asset found. Run npm run build first.`)
  }

  return `/assets/${fileName}`
}

describe('production server smoke behavior', () => {
  it('returns existing API health route', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('keeps unknown API routes out of the frontend fallback', async () => {
    const response = await request(app).get('/api/not-a-real-route')

    expect(response.status).toBe(404)
  })

  it('serves a built frontend asset', async () => {
    if (!existsSync(distDirectory)) {
      throw new Error('The dist directory is missing. Run npm run build first.')
    }

    const assetPath = findBuiltAsset('.js')
    const response = await request(app).get(assetPath)

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('javascript')
  })

  it('serves the frontend fallback', async () => {
    if (!existsSync(distDirectory)) {
      throw new Error('The dist directory is missing. Run npm run build first.')
    }

    const response = await request(app).get('/dashboard/example')

    expect(response.status).toBe(200)
    expect(response.type).toContain('html')

    const indexHtml = readFileSync(path.join(distDirectory, 'index.html'), 'utf8')
    expect(response.text).toBe(indexHtml)
  })

  it('rejects malformed existing API input', async () => {
    const response = await request(app).get('/api/air-quality/coordinates?latitude=91&longitude=0')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'Invalid query parameters.' })
  })

  it('returns the existing safe upstream-error response', async () => {
    const originalFetch = globalThis.fetch

    globalThis.fetch = async () => new Response('down', { status: 503 })

    try {
      const response = await request(app).get('/api/air-quality/coordinates?latitude=40&longitude=-74')

      expect(response.status).toBe(502)
      expect(response.body).toEqual({ error: 'The upstream service is temporarily unavailable.' })
      expect(response.body).not.toHaveProperty('stack')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
