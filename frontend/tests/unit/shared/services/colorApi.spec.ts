import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchColor } from '@/shared/services/colorApi'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('fetchColor', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('fetches color with correct HSL params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: { value: 'Red' },
        hex: { value: '#FF0000' },
        rgb: { r: 255, g: 0, b: 0 },
      }),
    })

    await fetchColor(0, 100, 50)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('hsl=0%2C100%25%2C50%25')
    )
  })

  it('transforms API response to ColorData', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: { value: 'Azure' },
        hex: { value: '#007FFF' },
        rgb: { r: 0, g: 127, b: 255 },
      }),
    })

    const result = await fetchColor(210, 100, 50)

    expect(result).toEqual({
      hue: 210,
      name: 'Azure',
      hex: '#007FFF',
      rgb: { r: 0, g: 127, b: 255 },
    })
  })

  it('throws on non-200 status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    await expect(fetchColor(0, 100, 50)).rejects.toThrow('Color API error: 500')
  })

  it('encodes percent signs in query string', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        name: { value: 'Gray' },
        hex: { value: '#808080' },
        rgb: { r: 128, g: 128, b: 128 },
      }),
    })

    await fetchColor(0, 0, 50)

    const calledUrl = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('%25') // % is encoded as %25
    expect(calledUrl).not.toContain(',%')
  })
})
