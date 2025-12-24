/**
 * Application Configuration
 *
 * Centralized config for easy tuning. All configurable values
 * should be defined here and imported where needed.
 *
 * @module shared/config
 */

import type { Config } from '@/shared/types'

export const config: Config = {
  /* --- API --- */
  api: {
    baseUrl: 'https://www.thecolorapi.com',
  },

  /* --- Binary Search Algorithm --- */
  algorithm: {
    startingSamples: 10,
    concurrencyLimit: 20, // HTTP/2 allows much higher; 20 is safe default
  },

  /* --- Default Values --- */
  defaults: {
    saturation: 100,
    lightness: 50,
  },

  /* --- UI --- */
  ui: {
    debounceMs: 300,
  },
}
