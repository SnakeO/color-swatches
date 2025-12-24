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
  get(key) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage full or unavailable - silently fail
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch {
      // silently fail
    }
  },

  swatchesKey(s, l) {
    return `swatches:${s}:${l}`
  },
}
