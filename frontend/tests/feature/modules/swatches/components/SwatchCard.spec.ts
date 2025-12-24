import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SwatchCard from '@/modules/swatches/components/SwatchCard.vue'
import type { ColorData } from '@/shared/types'
import type { PendingSwatch } from '@/modules/swatches/types'

const mockNotifySuccess = vi.fn()
const mockNotifyError = vi.fn()

vi.mock('@/shared/stores/app', () => ({
  useAppStore: vi.fn(() => ({
    notifySuccess: mockNotifySuccess,
    notifyError: mockNotifyError,
  })),
}))

describe('SwatchCard', () => {
  const loadedSwatch: ColorData = {
    hue: 180,
    name: 'Cyan',
    hex: '#00FFFF',
    rgb: { r: 0, g: 255, b: 255 },
  }

  const pendingSwatch: PendingSwatch = {
    hue: 0,
    pending: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined)
  })

  describe('pending state', () => {
    it('shows loading spinner', () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: pendingSwatch },
      })

      const spinner = wrapper.findComponent({ name: 'VProgressCircular' })
      expect(spinner.exists()).toBe(true)
    })

    it('shows "Loading..." text', () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: pendingSwatch },
      })

      expect(wrapper.text()).toContain('Loading...')
    })

    it('disables click interaction', async () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: pendingSwatch },
      })

      await wrapper.trigger('click')

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
    })

    it('has pending class', () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: pendingSwatch },
      })

      expect(wrapper.classes()).toContain('pending')
    })
  })

  describe('loaded state', () => {
    it('shows color block with correct background', () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: loadedSwatch },
      })

      const colorBlock = wrapper.find('.color-block')
      expect(colorBlock.attributes('style')).toContain('background-color')
      expect(colorBlock.attributes('style')).toContain('#00FFFF')
    })

    it('shows hex code', () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: loadedSwatch },
      })

      expect(wrapper.text()).toContain('#00FFFF')
    })

    it('shows color name', () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: loadedSwatch },
      })

      expect(wrapper.text()).toContain('Cyan')
    })

    it('does not have pending class', () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: loadedSwatch },
      })

      expect(wrapper.classes()).not.toContain('pending')
    })
  })

  describe('click interaction', () => {
    it('copies hex to clipboard on click', async () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: loadedSwatch },
      })

      await wrapper.trigger('click')
      await flushPromises()

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('#00FFFF')
    })

    it('shows success notification', async () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: loadedSwatch },
      })

      await wrapper.trigger('click')
      await flushPromises()

      expect(mockNotifySuccess).toHaveBeenCalledWith('Copied #00FFFF')
    })

    it('shows error notification on clipboard failure', async () => {
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
        new Error('Clipboard access denied')
      )

      const wrapper = mount(SwatchCard, {
        props: { swatch: loadedSwatch },
      })

      await wrapper.trigger('click')
      await flushPromises()

      expect(mockNotifyError).toHaveBeenCalledWith('Failed to copy')
    })

    it('does nothing when pending', async () => {
      const wrapper = mount(SwatchCard, {
        props: { swatch: pendingSwatch },
      })

      await wrapper.trigger('click')
      await flushPromises()

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
      expect(mockNotifySuccess).not.toHaveBeenCalled()
    })
  })
})
