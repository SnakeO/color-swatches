import { describe, it, expect, vi } from 'vitest'
import { createLimiter } from '@/shared/services/concurrency'

describe('createLimiter', () => {
  it('executes function and returns result', async () => {
    const limit = createLimiter(2)
    const fn = vi.fn().mockResolvedValue('result')

    const result = await limit(fn)

    expect(fn).toHaveBeenCalled()
    expect(result).toBe('result')
  })

  it('respects concurrency limit', async () => {
    const limit = createLimiter(2)
    let concurrent = 0
    let maxConcurrent = 0

    const slowFn = async () => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise((r) => setTimeout(r, 10))
      concurrent--
      return concurrent
    }

    await Promise.all([
      limit(slowFn),
      limit(slowFn),
      limit(slowFn),
      limit(slowFn),
    ])

    expect(maxConcurrent).toBe(2)
  })

  it('queues operations when limit reached', async () => {
    const limit = createLimiter(1)
    const order: number[] = []

    const task = (id: number) => async () => {
      order.push(id)
      await new Promise((r) => setTimeout(r, 5))
      return id
    }

    await Promise.all([
      limit(task(1)),
      limit(task(2)),
      limit(task(3)),
    ])

    expect(order).toEqual([1, 2, 3])
  })

  it('processes queue in FIFO order', async () => {
    const limit = createLimiter(1)
    const completionOrder: number[] = []

    const task = (id: number) => async () => {
      await new Promise((r) => setTimeout(r, 5))
      completionOrder.push(id)
      return id
    }

    const promises = [
      limit(task(1)),
      limit(task(2)),
      limit(task(3)),
    ]

    await Promise.all(promises)

    expect(completionOrder).toEqual([1, 2, 3])
  })

  it('handles errors without breaking queue', async () => {
    const limit = createLimiter(1)

    const task1 = limit(async () => 'task1-done')
    const task2 = limit(async () => {
      throw new Error('task2-error')
    })
    const task3 = limit(async () => 'task3-done')

    const [r1, r2, r3] = await Promise.allSettled([task1, task2, task3])

    expect(r1).toEqual({ status: 'fulfilled', value: 'task1-done' })
    expect(r2.status).toBe('rejected')
    expect((r2 as PromiseRejectedResult).reason.message).toBe('task2-error')
    expect(r3).toEqual({ status: 'fulfilled', value: 'task3-done' })
  })

  it('works with different return types', async () => {
    const limit = createLimiter(2)

    const stringResult = await limit(async () => 'hello')
    const numberResult = await limit(async () => 42)
    const objectResult = await limit(async () => ({ key: 'value' }))

    expect(stringResult).toBe('hello')
    expect(numberResult).toBe(42)
    expect(objectResult).toEqual({ key: 'value' })
  })
})
