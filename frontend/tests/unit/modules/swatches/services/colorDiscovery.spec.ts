import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSampleHues, discoverColors } from '@/modules/swatches/services/colorDiscovery'
import type { ColorData } from '@/shared/types'

vi.mock('@/modules/swatches/services/colorClient', () => ({
  getColorAtHue: vi.fn(),
}))

vi.mock('@/shared/services/concurrency', () => ({
  createLimiter: vi.fn(() => async <T>(fn: () => Promise<T>) => fn()),
}))

vi.mock('@/shared/config', () => ({
  config: {
    algorithm: {
      startingSamples: 5,
      concurrencyLimit: 2,
    },
  },
}))

import { getColorAtHue } from '@/modules/swatches/services/colorClient'

const mockGetColorAtHue = vi.mocked(getColorAtHue)

function createColor(hue: number, name: string): ColorData {
  return {
    hue,
    name,
    hex: `#${hue.toString(16).padStart(6, '0')}`,
    rgb: { r: hue, g: 0, b: 0 },
  }
}

describe('getSampleHues', () => {
  it('returns evenly distributed hues', () => {
    const hues = getSampleHues(5)

    expect(hues).toEqual([0, 90, 180, 269, 359])
  })

  it('enforces minimum of 3 samples', () => {
    const hues = getSampleHues(2)

    expect(hues.length).toBe(3)
    expect(hues).toEqual([0, 180, 359])
  })

  it('handles edge case count=0', () => {
    const hues = getSampleHues(0)

    expect(hues.length).toBe(3)
    expect(hues).toEqual([0, 180, 359])
  })

  it('handles count=1 (becomes 3)', () => {
    const hues = getSampleHues(1)

    expect(hues).toEqual([0, 180, 359])
  })
})

describe('discoverColors', () => {
  beforeEach(() => {
    mockGetColorAtHue.mockReset()
  })

  it('fetches initial samples in parallel', async () => {
    mockGetColorAtHue.mockImplementation(async (hue) =>
      createColor(hue, 'SameColor')
    )
    const onColorFound = vi.fn()

    await discoverColors(100, 50, onColorFound)

    expect(mockGetColorAtHue).toHaveBeenCalledTimes(5)
  })

  it('binary searches between different colors', async () => {
    mockGetColorAtHue.mockImplementation(async (hue) => {
      const name = hue < 180 ? 'ColorA' : 'ColorB'
      return createColor(hue, name)
    })
    const onColorFound = vi.fn()

    await discoverColors(100, 50, onColorFound)

    expect(mockGetColorAtHue.mock.calls.length).toBeGreaterThan(5)
  })

  it('calls onColorFound for each unique color', async () => {
    mockGetColorAtHue.mockImplementation(async (hue) => {
      if (hue < 100) return createColor(hue, 'Red')
      if (hue < 200) return createColor(hue, 'Green')
      return createColor(hue, 'Blue')
    })
    const onColorFound = vi.fn()

    await discoverColors(100, 50, onColorFound)

    const uniqueNames = new Set(
      onColorFound.mock.calls.map((call) => call[0].name)
    )
    expect(uniqueNames.size).toBe(3)
    expect(uniqueNames).toContain('Red')
    expect(uniqueNames).toContain('Green')
    expect(uniqueNames).toContain('Blue')
  })

  it('does not duplicate callback calls', async () => {
    mockGetColorAtHue.mockImplementation(async (hue) =>
      createColor(hue, hue < 180 ? 'First' : 'Second')
    )
    const onColorFound = vi.fn()

    await discoverColors(100, 50, onColorFound)

    const names = onColorFound.mock.calls.map((call) => call[0].name)
    const firstCount = names.filter((n) => n === 'First').length
    const secondCount = names.filter((n) => n === 'Second').length

    expect(firstCount).toBe(1)
    expect(secondCount).toBe(1)
  })

  it('handles all same colors (no binary search)', async () => {
    mockGetColorAtHue.mockImplementation(async (hue) =>
      createColor(hue, 'Uniform')
    )
    const onColorFound = vi.fn()

    await discoverColors(100, 50, onColorFound)

    expect(onColorFound).toHaveBeenCalledTimes(1)
    expect(onColorFound.mock.calls[0][0].name).toBe('Uniform')
  })

  it('handles alternating colors', async () => {
    mockGetColorAtHue.mockImplementation(async (hue) => {
      const name = hue % 2 === 0 ? 'Even' : 'Odd'
      return createColor(hue, name)
    })
    const onColorFound = vi.fn()

    await discoverColors(100, 50, onColorFound)

    const uniqueNames = new Set(
      onColorFound.mock.calls.map((call) => call[0].name)
    )
    expect(uniqueNames.size).toBe(2)
  })
})
