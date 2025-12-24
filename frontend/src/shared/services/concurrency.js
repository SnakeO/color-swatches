/**
 * Concurrency Service
 *
 * Provides utilities for controlling parallel async operations.
 *
 * @module shared/services/concurrency
 */

/**
 * Creates a concurrency limiter for parallel async operations
 * @param {number} limit - Max concurrent operations
 * @returns {Function} Wrapper that queues operations beyond the limit
 */
export function createLimiter(limit) {
  let running = 0
  const queue = []

  return async (fn) => {
    while (running >= limit) {
      await new Promise((resolve) => queue.push(resolve))
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
