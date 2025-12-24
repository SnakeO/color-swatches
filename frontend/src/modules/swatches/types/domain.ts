import type { ColorData } from '@/shared/types'

export interface PendingSwatch {
  hue: number
  pending: true
  name?: undefined
  hex?: undefined
  rgb?: undefined
}

export type Swatch = ColorData | PendingSwatch

export interface SwatchStats {
  total: number
  cached: boolean
}
