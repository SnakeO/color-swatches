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
import type { ColorData } from '@/shared/types'

interface ColorApiResponse {
  name: { value: string }
  hex: { value: string }
  rgb: { r: number; g: number; b: number }
}

/**
 * Fetch color data for a specific HSL value
 * @param hue - Hue value (0-359)
 * @param saturation - Saturation percentage (0-100)
 * @param lightness - Lightness percentage (0-100)
 * @param signal - Optional AbortSignal to cancel the request
 */
export async function fetchColor(
  hue: number,
  saturation: number,
  lightness: number,
  signal?: AbortSignal
): Promise<ColorData> {
  const params = new URLSearchParams({
    hsl: `${hue},${saturation}%,${lightness}%`,
  })

  const response = await fetch(`${config.api.baseUrl}/id?${params}`, { signal })

  if (!response.ok) {
    throw new Error(`Color API error: ${response.status}`)
  }

  const data: ColorApiResponse = await response.json()

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
