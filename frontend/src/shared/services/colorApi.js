/**
 * Color API Service
 *
 * Fetches color information from thecolorapi.com.
 * Converts HSL values to named colors with hex/rgb values.
 *
 * @module shared/services/colorApi
 * @see https://www.thecolorapi.com/docs
 */

import { config } from '@/shared/config'

/**
 * Fetch color data for a specific HSL value
 * @param {number} hue - Hue value (0-359)
 * @param {number} saturation - Saturation percentage (0-100)
 * @param {number} lightness - Lightness percentage (0-100)
 * @returns {Promise<{hue: number, name: string, hex: string, rgb: {r: number, g: number, b: number}}>}
 */
export async function fetchColor(hue, saturation, lightness) {
  const params = new URLSearchParams({
    hsl: `${hue},${saturation}%,${lightness}%`,
  })

  const response = await fetch(`${config.api.baseUrl}/id?${params}`)

  if (!response.ok) {
    throw new Error(`Color API error: ${response.status}`)
  }

  const data = await response.json()

  return {
    hue,
    name: data.name.value,
    hex: data.hex.value,
    rgb: {
      r: data.rgb.r,
      g: data.rgb.g,
      b: data.rgb.b,
    },
  }
}
