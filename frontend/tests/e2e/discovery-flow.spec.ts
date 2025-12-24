import { test, expect } from '@playwright/test'

test.describe('Color Discovery Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test('loads with default saturation and lightness', async ({ page }) => {
    const saturationInput = page.locator('input[type="number"]').first()
    const lightnessInput = page.locator('input[type="number"]').nth(1)

    await expect(saturationInput).toHaveValue('100')
    await expect(lightnessInput).toHaveValue('50')
  })

  test('shows loading state during discovery', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')

    const loadingChip = page.locator('.v-chip').filter({ hasText: 'colors found' })
    await expect(loadingChip).toBeVisible({ timeout: 10000 })
  })

  test('displays discovered colors in sorted order', async ({ page }) => {
    await page.waitForSelector('.swatch-grid', { timeout: 15000 })

    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('.swatch-card:not(.pending)')
      return cards.length > 3
    }, { timeout: 30000 })

    const swatchNames = await page.locator('.swatch-name').allTextContents()
    expect(swatchNames.length).toBeGreaterThan(3)
  })

  test('shows color count in stats badge', async ({ page }) => {
    await page.waitForSelector('.v-chip', { timeout: 15000 })

    await page.waitForFunction(() => {
      const chip = document.querySelector('.v-chip')
      return chip && chip.textContent?.includes('colors found')
    }, { timeout: 30000 })

    const chipText = await page.locator('.v-chip').first().textContent()
    expect(chipText).toMatch(/\d+ colors found/)
  })

  test('clicking swatch copies hex to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('.swatch-card:not(.pending)')
      return cards.length > 0
    }, { timeout: 30000 })

    const firstSwatch = page.locator('.swatch-card:not(.pending)').first()
    await firstSwatch.click()

    const snackbar = page.locator('.v-snackbar')
    await expect(snackbar).toContainText('Copied', { timeout: 5000 })
  })

  test.describe('control changes', () => {
    test('triggers new discovery when saturation changes', async ({ page }) => {
      await page.waitForFunction(() => {
        const cards = document.querySelectorAll('.swatch-card:not(.pending)')
        return cards.length > 0
      }, { timeout: 30000 })

      const saturationInput = page.locator('input[type="number"]').first()
      await saturationInput.fill('50')
      await saturationInput.press('Enter')

      await expect(page.locator('.v-chip')).toContainText('colors found', { timeout: 15000 })
    })

    test('triggers new discovery when lightness changes', async ({ page }) => {
      await page.waitForFunction(() => {
        const cards = document.querySelectorAll('.swatch-card:not(.pending)')
        return cards.length > 0
      }, { timeout: 30000 })

      const lightnessInput = page.locator('input[type="number"]').nth(1)
      await lightnessInput.fill('25')
      await lightnessInput.press('Enter')

      await expect(page.locator('.v-chip')).toContainText('colors found', { timeout: 15000 })
    })

    test('debounces text input changes', async ({ page }) => {
      await page.waitForFunction(() => {
        const cards = document.querySelectorAll('.swatch-card:not(.pending)')
        return cards.length > 0
      }, { timeout: 30000 })

      const saturationInput = page.locator('input[type="number"]').first()

      await saturationInput.fill('60')

      await page.waitForTimeout(150)

      await saturationInput.fill('70')

      await page.waitForTimeout(400)

      await expect(page.locator('.v-chip')).toContainText('colors found', { timeout: 15000 })
    })
  })
})
