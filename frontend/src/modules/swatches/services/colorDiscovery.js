/**
 * Color Discovery Service
 *
 * Binary search algorithm to efficiently find all distinct
 * color names across the hue spectrum for a given S/L combination.
 *
 * Algorithm:
 *   1. Sample evenly distributed hues (0 to 359)
 *   2. Binary search between adjacent samples with different names
 *   3. Also search large gaps (>30) even if endpoints have same name
 *
 * @module modules/swatches/services/colorDiscovery
 */

import { config } from '@/shared/config'
import { createLimiter } from '@/shared/services/concurrency'
import { getColorAtHue } from './colorClient'

const { startingSamples: STARTING_SAMPLES, concurrencyLimit: CONCURRENCY_LIMIT } = config.algorithm

/**
 * Generate evenly distributed sample hues from 0 to 359
 * @param {number} count - Number of samples (minimum 2)
 * @returns {number[]} Array of hue values
 */
export function getSampleHues(count) {
  if (count < 2) {
    count = 2
  }
  const hues = []
  for (let i = 0; i < count; i++) {
    hues.push(Math.round((359 * i) / (count - 1)))
  }
  return hues
}

/**
 * Binary search for color boundaries between two points
 * @param {Object} params - Search parameters
 * @param {Object} params.left - Left boundary color
 * @param {Object} params.right - Right boundary color
 * @param {number} params.s - Saturation
 * @param {number} params.l - Lightness
 * @param {Set} params.foundNames - Set of already found color names
 * @param {Function} params.limit - Concurrency limiter
 * @param {Function} onColorFound - Callback when new color discovered
 */
async function binarySearch({ left, right, s, l, foundNames, limit }, onColorFound) {
  // recursive base case
  if (right.hue - left.hue <= 1) {
    return
  }

  const midHue = Math.floor((left.hue + right.hue) / 2)
  const midPoint = await getColorAtHue(midHue, s, l, limit)

  if (!foundNames.has(midPoint.name)) {
    foundNames.add(midPoint.name)
    onColorFound(midPoint)
  }

  // Search BOTH sides in PARALLEL
  const branches = []
  if (midPoint.name !== left.name) {
    branches.push(binarySearch({ left, right: midPoint, s, l, foundNames, limit }, onColorFound))
  }
  if (midPoint.name !== right.name) {
    branches.push(binarySearch({ left: midPoint, right, s, l, foundNames, limit }, onColorFound))
  }
  await Promise.all(branches)
}

/**
 * Discover all distinct colors for given S/L values
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @param {Function} onColorFound - Callback for each discovered color
 * @returns {Promise<void>}
 */
export async function discoverColors(s, l, onColorFound) {
  const limit = createLimiter(CONCURRENCY_LIMIT)
  const foundNames = new Set()

  // Phase 1: Fetch initial samples in PARALLEL
  const sampleHues = getSampleHues(STARTING_SAMPLES)
  const samplePromises = sampleHues.map((hue) => getColorAtHue(hue, s, l, limit))
  const samplePoints = await Promise.all(samplePromises)

  // Emit unique colors from initial samples
  for (const point of samplePoints) {
    if (!foundNames.has(point.name)) {
      foundNames.add(point.name)
      onColorFound(point)
    }
  }

  // Phase 2: Binary search between samples with different names
  const gapSearches = []
  for (let i = 0; i < samplePoints.length - 1; i++) {
    const left = samplePoints[i]
    const right = samplePoints[i + 1]

    if (left.name !== right.name) {
      gapSearches.push(binarySearch({ left, right, s, l, foundNames, limit }, onColorFound))
    }
  }
  await Promise.all(gapSearches)
}
