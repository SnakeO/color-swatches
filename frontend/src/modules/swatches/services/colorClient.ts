/**
 * Color API Client
 *
 * Fetches individual colors with concurrency limiting.
 *
 * @module modules/swatches/services/colorClient
 */

import { fetchColor } from '@/shared/services/colorApi'
import type { ColorData, LimiterFunction } from '@/shared/types'

/**
 * Fetch color with concurrency control
 * @param hue - Hue value (0-359)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @param limit - Concurrency limiter function
 * @param signal - Optional AbortSignal to cancel the request
 */
export async function getColorAtHue(
  hue: number,
  s: number,
  l: number,
  limit: LimiterFunction,
  signal?: AbortSignal
): Promise<ColorData> {
  return await limit(() => fetchColor(hue, s, l, signal))
}
