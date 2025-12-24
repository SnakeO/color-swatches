/**
 * useSwatches Composable
 *
 * Manages reactive state for color swatches.
 * Delegates discovery to colorDiscovery service.
 *
 * @module modules/swatches/composables/useSwatches
 * @returns {Object} { swatches, loading, stats, fetchSwatches, cleanup }
 */

import { ref, readonly } from 'vue'
import { cache } from '@/shared/services/cache'
import { useAppStore } from '@/shared/stores/app'
import { discoverColors } from '../services/colorDiscovery'

export function useSwatches() {
  const appStore = useAppStore()

  /* --- Reactive State --- */
  const swatches = ref([])
  const loading = ref(false)
  const stats = ref({ total: 0, cached: false })

  let abortController = null

  /* --- Helpers --- */

  /** Insert swatch in sorted order by hue */
  function insertSorted(swatch) {
    const index = swatches.value.findIndex((s) => s.hue > swatch.hue)
    if (index === -1) {
      swatches.value.push(swatch)
    } else {
      swatches.value.splice(index, 0, swatch)
    }
  }

  /* --- Public API --- */

  /** Fetch all swatches for given saturation/lightness (with caching) */
  async function fetchSwatches(saturation, lightness) {
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
      const cachedSwatches = cache.get(swatchesKey)

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
      if (error.name !== 'AbortError') {
        appStore.notifyError('Failed to fetch swatches: ' + error.message)
      }
    } finally {
      loading.value = false
    }
  }

  /** Cancel any in-progress fetch */
  function cleanup() {
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
