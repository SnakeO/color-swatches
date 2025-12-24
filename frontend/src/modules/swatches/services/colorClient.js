/**
 * Color API Client
 *
 * Fetches individual colors with concurrency limiting.
 *
 * @module modules/swatches/services/colorClient
 */

import { fetchColor } from '@/shared/services/colorApi'

/**
 * Fetch color with concurrency control
 * @param {number} hue - Hue value (0-359)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @param {Function} limit - Concurrency limiter function
 * @returns {Promise<Object>} Color data { hue, hex, name }
 */
export async function getColorAtHue(hue, s, l, limit) {
  return await limit(() => fetchColor(hue, s, l))
}
