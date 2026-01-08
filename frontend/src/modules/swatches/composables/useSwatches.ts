/**
 * useSwatches Composable
 *
 * Manages reactive state for color swatches.
 * Delegates discovery to colorDiscovery service.
 *
 * @module modules/swatches/composables/useSwatches
 */

import { ref, readonly, type DeepReadonly, type Ref } from 'vue'
import { cache } from '@/shared/services/cache'
import { useAppStore } from '@/shared/stores/app'
import { discoverColors } from '../services/colorDiscovery'
import type { ColorData } from '@/shared/types'
import type { SwatchStats } from '../types'

export interface UseSwatchesReturn {
  swatches: DeepReadonly<Ref<ColorData[]>>
  loading: DeepReadonly<Ref<boolean>>
  stats: DeepReadonly<Ref<SwatchStats>>
  fetchSwatches: (saturation: number, lightness: number) => Promise<void>
  cleanup: () => void
}

export function useSwatches(): UseSwatchesReturn {
  const appStore = useAppStore()

  /* --- Reactive State --- */
  const swatches = ref<ColorData[]>([])
  const loading = ref(false)
  const stats = ref<SwatchStats>({ total: 0, cached: false })

  let abortController: AbortController | null = null

  /* --- Helpers --- */

  /** Insert swatch in sorted order by hue */
  function insertSorted(swatch: ColorData): void {
    swatches.value.push(swatch)
    swatches.value.sort((a, b) => a.hue - b.hue)
  }

  /* --- Public API --- */

  /** Fetch all swatches for given saturation/lightness (with caching) */
  async function fetchSwatches(saturation: number, lightness: number): Promise<void> {
    // Abort any in-progress fetch
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()

    // Reset state
    swatches.value = []
    loading.value = true
    stats.value = { total: 0, cached: false }

    try {
      // Check complete swatches cache first
      const swatchesKey = cache.swatchesKey(saturation, lightness)
      const cachedSwatches = cache.get<ColorData[]>(swatchesKey)

      if (cachedSwatches) {
        // Cache hit - load all swatches instantly
        swatches.value = cachedSwatches
        stats.value = { total: cachedSwatches.length, cached: true }
        return
      }

      // Cache miss - run discovery (callback inserts each as found)
      await discoverColors(saturation, lightness, insertSorted)

      // Cache results (already sorted by insertSorted)
      cache.set(swatchesKey, swatches.value)

      stats.value = { total: swatches.value.length, cached: false }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        appStore.notifyError('Failed to fetch swatches: ' + error.message)
      }
    } finally {
      loading.value = false
    }
  }

  /** Cancel any in-progress fetch */
  function cleanup(): void {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  return {
    swatches: readonly(swatches),
    loading: readonly(loading),
    stats: readonly(stats),
    fetchSwatches,
    cleanup,
  }
}
