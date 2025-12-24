/**
 * LocalStorage Cache Service
 *
 * Provides persistent caching for color swatches using localStorage.
 *
 * Cache key: swatches:{s}:{l} → Complete swatch array for S/L combination
 *
 * @module shared/services/cache
 */

export const cache = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : null
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage full or unavailable - silently fail
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // silently fail
    }
  },

  swatchesKey(s: number, l: number): string {
    return `swatches:${s}:${l}`
  },
}
