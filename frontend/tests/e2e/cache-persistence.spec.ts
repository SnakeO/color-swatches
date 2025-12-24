import { test, expect } from '@playwright/test'

test.describe('Cache Persistence', () => {
  test('caches discovery results in localStorage', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')

    await page.waitForFunction(() => {
      const chip = document.querySelector('.v-chip')
      return chip && !chip.querySelector('.v-progress-circular')
    }, { timeout: 60000 })

    const cacheKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter((key) => key.startsWith('swatches:'))
    })

    expect(cacheKeys.length).toBeGreaterThan(0)
    expect(cacheKeys[0]).toBe('swatches:100:50')
  })

  test('loads from cache on repeat request (instant)', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')

    await page.waitForFunction(() => {
      const chip = document.querySelector('.v-chip')
      return chip && !chip.querySelector('.v-progress-circular')
    }, { timeout: 60000 })

    const saturationInput = page.locator('input[type="number"]').first()
    await saturationInput.fill('80')
    await saturationInput.press('Enter')

    await page.waitForFunction(() => {
      const chip = document.querySelector('.v-chip')
      return chip && !chip.querySelector('.v-progress-circular')
    }, { timeout: 60000 })

    await saturationInput.fill('100')
    await saturationInput.press('Enter')

    await expect(page.locator('.v-chip')).toContainText('colors found', { timeout: 5000 })

    const cachedIndicator = page.locator('text=(cached)')
    await expect(cachedIndicator).toBeVisible({ timeout: 3000 })
  })

  test('shows "(cached)" indicator on cache hit', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')

    await page.waitForFunction(() => {
      const chip = document.querySelector('.v-chip')
      return chip && !chip.querySelector('.v-progress-circular')
    }, { timeout: 60000 })

    await page.reload()

    await page.waitForSelector('.v-chip', { timeout: 10000 })

    const cachedIndicator = page.locator('text=(cached)')
    await expect(cachedIndicator).toBeVisible({ timeout: 5000 })
  })

  test('persists cache across page reload', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')

    await page.waitForFunction(() => {
      const chip = document.querySelector('.v-chip')
      return chip && !chip.querySelector('.v-progress-circular')
    }, { timeout: 60000 })

    const initialCount = await page.evaluate(() => {
      return Object.keys(localStorage).filter((key) => key.startsWith('swatches:')).length
    })

    await page.reload()

    const afterReloadCount = await page.evaluate(() => {
      return Object.keys(localStorage).filter((key) => key.startsWith('swatches:')).length
    })

    expect(afterReloadCount).toBe(initialCount)
    expect(afterReloadCount).toBeGreaterThan(0)
  })
})
