import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cache } from '@/shared/services/cache'

describe('cache service', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('get', () => {
    it('returns parsed value for existing key', () => {
      const testData = { foo: 'bar', num: 42 }
      localStorage.setItem('test-key', JSON.stringify(testData))

      const result = cache.get<typeof testData>('test-key')

      expect(result).toEqual(testData)
    })

    it('returns null for missing key', () => {
      const result = cache.get('nonexistent')

      expect(result).toBeNull()
    })

    it('returns null on JSON parse error', () => {
      localStorage.setItem('invalid', 'not-json{')

      const result = cache.get('invalid')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('stores JSON stringified value', () => {
      const testData = { name: 'test', values: [1, 2, 3] }

      cache.set('my-key', testData)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'my-key',
        JSON.stringify(testData)
      )
    })

    it('silently fails when localStorage throws', () => {
      vi.mocked(localStorage.setItem).mockImplementationOnce(() => {
        throw new Error('QuotaExceededError')
      })

      expect(() => cache.set('key', { data: 'value' })).not.toThrow()
    })
  })

  describe('remove', () => {
    it('removes item from localStorage', () => {
      localStorage.setItem('to-remove', '"value"')

      cache.remove('to-remove')

      expect(localStorage.removeItem).toHaveBeenCalledWith('to-remove')
    })

    it('silently fails on error', () => {
      vi.mocked(localStorage.removeItem).mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      expect(() => cache.remove('key')).not.toThrow()
    })
  })

  describe('swatchesKey', () => {
    it('returns correct format: swatches:{s}:{l}', () => {
      expect(cache.swatchesKey(50, 75)).toBe('swatches:50:75')
      expect(cache.swatchesKey(0, 100)).toBe('swatches:0:100')
      expect(cache.swatchesKey(100, 0)).toBe('swatches:100:0')
    })
  })
})
