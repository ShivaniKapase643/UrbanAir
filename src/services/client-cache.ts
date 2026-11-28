const CACHE_PREFIX = 'urban-air:'
const MAX_AGE_MS = 10 * 60 * 1000

function getStorageKey(key: string): string {
  return CACHE_PREFIX + key
}

export function readClientCache<T>(key: string): T | undefined {
  try {
    const rawValue = localStorage.getItem(getStorageKey(key))

    if (!rawValue) {
      return undefined
    }

    const entry = JSON.parse(rawValue) as { value: T; expiresAt: number }

    if (Date.now() >= entry.expiresAt) {
      localStorage.removeItem(getStorageKey(key))
      return undefined
    }

    return entry.value
  } catch {
    return undefined
  }
}

export function writeClientCache<T>(key: string, value: T): void {
  try {
    const entry = {
      value,
      expiresAt: Date.now() + MAX_AGE_MS,
    }

    localStorage.setItem(getStorageKey(key), JSON.stringify(entry))
  } catch {
    // Storage may be unavailable or disabled by the browser.
  }
}
