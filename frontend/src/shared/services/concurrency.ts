/**
 * Concurrency Service
 *
 * Provides utilities for controlling parallel async operations.
 *
 * @module shared/services/concurrency
 */

import type { LimiterFunction } from '@/shared/types'

/**
 * Creates a concurrency limiter for parallel async operations
 * @param limit - Max concurrent operations
 * @returns Wrapper that queues operations beyond the limit
 */
export function createLimiter(limit: number): LimiterFunction {
  let running = 0
  const queue: Array<() => void> = []

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    while (running >= limit) {
      await new Promise<void>((resolve) => queue.push(resolve))
    }
    running++
    try {
      return await fn()
    } finally {
      running--
      const next = queue.shift()
      if (next) {
        next()
      }
    }
  }
}
