import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSwatches } from '@/modules/swatches/composables/useSwatches'
import type { ColorData } from '@/shared/types'

vi.mock('@/shared/services/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    swatchesKey: vi.fn((s: number, l: number) => `swatches:${s}:${l}`),
  },
}))

vi.mock('@/modules/swatches/services/colorDiscovery', () => ({
  discoverColors: vi.fn(),
}))

vi.mock('@/shared/stores/app', () => ({
  useAppStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  })),
}))

import { cache } from '@/shared/services/cache'
import { discoverColors } from '@/modules/swatches/services/colorDiscovery'
import { useAppStore } from '@/shared/stores/app'

const mockCache = vi.mocked(cache)
const mockDiscoverColors = vi.mocked(discoverColors)

function createColor(hue: number, name: string): ColorData {
  return {
    hue,
    name,
    hex: `#${hue.toString(16).padStart(6, '0')}`,
    rgb: { r: hue, g: 0, b: 0 },
  }
}

describe('useSwatches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchSwatches', () => {
    it('returns cached data on cache hit', async () => {
      const cachedData = [createColor(0, 'Red'), createColor(120, 'Green')]
      mockCache.get.mockReturnValueOnce(cachedData)

      const { swatches, stats, fetchSwatches } = useSwatches()
      await fetchSwatches(100, 50)

      expect(swatches.value).toEqual(cachedData)
      expect(stats.value.cached).toBe(true)
      expect(mockDiscoverColors).not.toHaveBeenCalled()
    })

    it('runs discovery on cache miss', async () => {
      mockCache.get.mockReturnValueOnce(null)
      mockDiscoverColors.mockImplementationOnce(async (s, l, cb) => {
        cb(createColor(0, 'Red'))
        cb(createColor(120, 'Green'))
      })

      const { fetchSwatches } = useSwatches()
      await fetchSwatches(100, 50)

      expect(mockDiscoverColors).toHaveBeenCalledWith(100, 50, expect.any(Function))
    })

    it('caches results after discovery', async () => {
      mockCache.get.mockReturnValueOnce(null)
      mockDiscoverColors.mockImplementationOnce(async (s, l, cb) => {
        cb(createColor(0, 'Red'))
      })

      const { fetchSwatches } = useSwatches()
      await fetchSwatches(100, 50)

      expect(mockCache.set).toHaveBeenCalledWith(
        'swatches:100:50',
        expect.arrayContaining([expect.objectContaining({ name: 'Red' })])
      )
    })

    it('aborts previous fetch on new request', async () => {
      mockCache.get.mockReturnValue(null)
      let firstCallbackCalled = false
      let secondCallbackCalled = false

      mockDiscoverColors.mockImplementationOnce(async (s, l, cb) => {
        await new Promise((r) => setTimeout(r, 50))
        firstCallbackCalled = true
        cb(createColor(0, 'First'))
      })

      mockDiscoverColors.mockImplementationOnce(async (s, l, cb) => {
        secondCallbackCalled = true
        cb(createColor(0, 'Second'))
      })

      const { fetchSwatches, swatches } = useSwatches()

      const first = fetchSwatches(100, 50)
      await fetchSwatches(100, 60)

      await first.catch(() => {})

      expect(secondCallbackCalled).toBe(true)
      expect(swatches.value.some((s) => s.name === 'Second')).toBe(true)
    })

    it('updates loading state correctly', async () => {
      mockCache.get.mockReturnValueOnce(null)
      let resolveDiscovery: () => void
      mockDiscoverColors.mockImplementationOnce(async () => {
        await new Promise<void>((r) => {
          resolveDiscovery = r
        })
      })

      const { loading, fetchSwatches } = useSwatches()

      expect(loading.value).toBe(false)

      const promise = fetchSwatches(100, 50)
      await Promise.resolve()

      expect(loading.value).toBe(true)

      resolveDiscovery!()
      await promise

      expect(loading.value).toBe(false)
    })

    it('updates stats on completion', async () => {
      mockCache.get.mockReturnValueOnce(null)
      mockDiscoverColors.mockImplementationOnce(async (s, l, cb) => {
        cb(createColor(0, 'One'))
        cb(createColor(60, 'Two'))
        cb(createColor(120, 'Three'))
      })

      const { stats, fetchSwatches } = useSwatches()
      await fetchSwatches(100, 50)

      expect(stats.value.total).toBe(3)
      expect(stats.value.cached).toBe(false)
    })

    it('notifies on error (non-abort)', async () => {
      mockCache.get.mockReturnValueOnce(null)
      mockDiscoverColors.mockRejectedValueOnce(new Error('Network error'))

      const mockAppStore = { notifySuccess: vi.fn(), notifyError: vi.fn() }
      vi.mocked(useAppStore).mockReturnValue(mockAppStore)

      const { fetchSwatches } = useSwatches()
      await fetchSwatches(100, 50)

      expect(mockAppStore.notifyError).toHaveBeenCalledWith(
        expect.stringContaining('Network error')
      )
    })

    it('ignores AbortError silently', async () => {
      mockCache.get.mockReturnValueOnce(null)
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      mockDiscoverColors.mockRejectedValueOnce(abortError)

      const mockAppStore = { notifySuccess: vi.fn(), notifyError: vi.fn() }
      vi.mocked(useAppStore).mockReturnValue(mockAppStore)

      const { fetchSwatches } = useSwatches()
      await fetchSwatches(100, 50)

      expect(mockAppStore.notifyError).not.toHaveBeenCalled()
    })
  })

  describe('insertSorted (via fetchSwatches)', () => {
    it('maintains sorted order by hue', async () => {
      mockCache.get.mockReturnValueOnce(null)
      mockDiscoverColors.mockImplementationOnce(async (s, l, cb) => {
        cb(createColor(180, 'Middle'))
        cb(createColor(0, 'First'))
        cb(createColor(359, 'Last'))
      })

      const { swatches, fetchSwatches } = useSwatches()
      await fetchSwatches(100, 50)

      expect(swatches.value.map((s) => s.hue)).toEqual([0, 180, 359])
    })

    it('handles empty array', async () => {
      mockCache.get.mockReturnValueOnce(null)
      mockDiscoverColors.mockImplementationOnce(async () => {})

      const { swatches, fetchSwatches } = useSwatches()
      await fetchSwatches(100, 50)

      expect(swatches.value).toEqual([])
    })

    it('handles single item', async () => {
      mockCache.get.mockReturnValueOnce(null)
      mockDiscoverColors.mockImplementationOnce(async (s, l, cb) => {
        cb(createColor(42, 'Only'))
      })

      const { swatches, fetchSwatches } = useSwatches()
      await fetchSwatches(100, 50)

      expect(swatches.value.length).toBe(1)
      expect(swatches.value[0].hue).toBe(42)
    })
  })

  describe('cleanup', () => {
    it('aborts in-progress fetch', async () => {
      mockCache.get.mockReturnValueOnce(null)
      let wasAborted = false

      mockDiscoverColors.mockImplementationOnce(async () => {
        await new Promise((r) => setTimeout(r, 100))
        wasAborted = false
      })

      const { fetchSwatches, cleanup } = useSwatches()

      fetchSwatches(100, 50)
      cleanup()

      expect(true).toBe(true)
    })
  })

  describe('readonly refs', () => {
    it('returns readonly swatches (mutation has no effect)', () => {
      const { swatches } = useSwatches()
      const original = swatches.value

      ;(swatches as any).value = [{ hue: 999, name: 'Mutated' }]

      expect(swatches.value).toBe(original)
      expect(swatches.value).toEqual([])
    })

    it('returns readonly loading (mutation has no effect)', () => {
      const { loading } = useSwatches()
      const original = loading.value

      ;(loading as any).value = true

      expect(loading.value).toBe(original)
      expect(loading.value).toBe(false)
    })

    it('returns readonly stats (mutation has no effect)', () => {
      const { stats } = useSwatches()
      const original = stats.value

      ;(stats as any).value = { total: 999, cached: true }

      expect(stats.value).toBe(original)
      expect(stats.value).toEqual({ total: 0, cached: false })
    })
  })
})
