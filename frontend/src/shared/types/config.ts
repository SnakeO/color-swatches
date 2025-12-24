export interface Config {
  api: { baseUrl: string }
  algorithm: { startingSamples: number; concurrencyLimit: number }
  defaults: { saturation: number; lightness: number }
  ui: { debounceMs: number }
}
