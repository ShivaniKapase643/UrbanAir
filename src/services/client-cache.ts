const CACHE_PREFIX = 'urban-air:'
const MAX_AGE_MS = 10 * 60 * 1000

export function readClientCache<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return undefined
    const entry = JSON.parse(raw) as { value: T; expiresAt: number }
    if (Date.now() >= entry.expiresAt) { localStorage.removeItem(CACHE_PREFIX + key); return undefined }
    return entry.value
  } catch { return undefined }
}

export function writeClientCache<T>(key: string, value: T): void {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, expiresAt: Date.now() + MAX_AGE_MS })) } catch { /* Storage may be unavailable. */ }
}
