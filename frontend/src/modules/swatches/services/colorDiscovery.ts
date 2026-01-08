/**
 * Color Discovery Service
 *
 * Binary search algorithm to efficiently find all distinct
 * color names across the hue spectrum for a given S/L combination.
 *
 * Algorithm:
 *   1. Sample evenly distributed hues (0 to 359)
 *   2. Binary search between adjacent samples with different names
 *
 * @module modules/swatches/services/colorDiscovery
 */

import { config } from '@/shared/config'
import { createLimiter } from '@/shared/services/concurrency'
import { getColorAtHue } from './colorClient'
import type { ColorData, LimiterFunction } from '@/shared/types'

const { startingSamples: STARTING_SAMPLES, concurrencyLimit: CONCURRENCY_LIMIT } = config.algorithm

interface BinarySearchParams {
  left: ColorData
  right: ColorData
  s: number
  l: number
  foundNames: Set<string>
  limit: LimiterFunction
  signal?: AbortSignal
}

/**
 * Generate evenly distributed sample hues from 0 to 359
 * @param count - Number of samples (minimum 3)
 */
export function getSampleHues(count: number): number[] {
  if (count < 3) {
    count = 3
  }
  const hues: number[] = []
  for (let i = 0; i < count; i++) {
    hues.push(Math.round((359 * i) / (count - 1)))
  }
  return hues
}

/**
 * Binary search for color boundaries between two points
 */
async function binarySearch(
  { left, right, s, l, foundNames, limit, signal }: BinarySearchParams,
  onColorFound: (color: ColorData) => void
): Promise<void> {
  // Check if aborted
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // recursive base case
  if (right.hue - left.hue <= 1) {
    return
  }

  const midHue = Math.floor((left.hue + right.hue) / 2)
  const midPoint = await getColorAtHue(midHue, s, l, limit, signal)

  if (!foundNames.has(midPoint.name)) {
    foundNames.add(midPoint.name)
    onColorFound(midPoint)
  }

  // Search BOTH sides in PARALLEL
  const branches: Promise<void>[] = []
  if (midPoint.name !== left.name) {
    branches.push(binarySearch({ left, right: midPoint, s, l, foundNames, limit, signal }, onColorFound))
  }
  if (midPoint.name !== right.name) {
    branches.push(binarySearch({ left: midPoint, right, s, l, foundNames, limit, signal }, onColorFound))
  }
  await Promise.all(branches)
}

/**
 * Discover all distinct colors for given S/L values
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @param onColorFound - Callback for each discovered color
 * @param signal - Optional AbortSignal to cancel discovery
 */
export async function discoverColors(
  s: number,
  l: number,
  onColorFound: (color: ColorData) => void,
  signal?: AbortSignal
): Promise<void> {
  // Check if already aborted
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  const limit = createLimiter(CONCURRENCY_LIMIT)
  const foundNames = new Set<string>()

  // Phase 1: Fetch initial samples in PARALLEL
  const sampleHues = getSampleHues(STARTING_SAMPLES)
  const samplePromises = sampleHues.map((hue) => getColorAtHue(hue, s, l, limit, signal))
  const samplePoints = await Promise.all(samplePromises)

  // Check if aborted after initial fetch
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // Emit unique colors from initial samples
  for (const point of samplePoints) {
    if (!foundNames.has(point.name)) {
      foundNames.add(point.name)
      onColorFound(point)
    }
  }

  // Phase 2: Binary search between samples with different names
  const gapSearches: Promise<void>[] = []
  for (let i = 0; i < samplePoints.length - 1; i++) {
    const left = samplePoints[i]
    const right = samplePoints[i + 1]

    if (left && right && left.name !== right.name) {
      gapSearches.push(binarySearch({ left, right, s, l, foundNames, limit, signal }, onColorFound))
    }
  }
  await Promise.all(gapSearches)
}
