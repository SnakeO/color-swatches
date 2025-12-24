import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SwatchGrid from '@/modules/swatches/components/SwatchGrid.vue'
import SwatchCard from '@/modules/swatches/components/SwatchCard.vue'
import type { ColorData } from '@/shared/types'

vi.mock('@/shared/stores/app', () => ({
  useAppStore: vi.fn(() => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  })),
}))

describe('SwatchGrid', () => {
  const sampleSwatches: ColorData[] = [
    { hue: 0, name: 'Red', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 } },
    { hue: 120, name: 'Green', hex: '#00FF00', rgb: { r: 0, g: 255, b: 0 } },
    { hue: 240, name: 'Blue', hex: '#0000FF', rgb: { r: 0, g: 0, b: 255 } },
  ]

  describe('empty state', () => {
    it('shows empty message when not loading and no swatches', () => {
      const wrapper = mount(SwatchGrid, {
        props: {
          swatches: [],
          loading: false,
        },
      })

      expect(wrapper.text()).toContain('Adjust the sliders to discover color swatches')
    })

    it('shows palette icon', () => {
      const wrapper = mount(SwatchGrid, {
        props: {
          swatches: [],
          loading: false,
        },
      })

      const icon = wrapper.findComponent({ name: 'VIcon' })
      expect(icon.exists()).toBe(true)
      expect(wrapper.html()).toContain('mdi-palette')
    })
  })

  describe('loading state', () => {
    it('shows warning chip with spinner', () => {
      const wrapper = mount(SwatchGrid, {
        props: {
          swatches: [],
          loading: true,
        },
      })

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.exists()).toBe(true)
      expect(chip.props('color')).toBe('warning')

      const spinner = chip.findComponent({ name: 'VProgressCircular' })
      expect(spinner.exists()).toBe(true)
    })

    it('shows initial placeholder when no swatches yet', () => {
      const wrapper = mount(SwatchGrid, {
        props: {
          swatches: [],
          loading: true,
        },
      })

      const cards = wrapper.findAllComponents(SwatchCard)
      expect(cards.length).toBe(1)
      expect(cards[0].props('swatch')).toEqual({ hue: 0, pending: true })
    })

    it('shows trailing placeholder with existing swatches', () => {
      const wrapper = mount(SwatchGrid, {
        props: {
          swatches: sampleSwatches,
          loading: true,
        },
      })

      const cards = wrapper.findAllComponents(SwatchCard)
      expect(cards.length).toBe(4)

      const lastCard = cards[3]
      expect(lastCard.props('swatch')).toEqual({ hue: 999, pending: true })
    })

    it('shows "X colors found..." text', () => {
      const wrapper = mount(SwatchGrid, {
        props: {
          swatches: sampleSwatches,
          loading: true,
        },
      })

      expect(wrapper.text()).toContain('3 colors found...')
    })
  })

  describe('loaded state', () => {
    it('shows success chip with checkmark', () => {
      const wrapper = mount(SwatchGrid, {
        props: {
          swatches: sampleSwatches,
          loading: false,
          stats: { total: 3, cached: false },
        },
      })

      const chip = wrapper.findComponent({ name: 'VChip' })
      expect(chip.exists()).toBe(true)
      expect(chip.props('color')).toBe('success')

      const icon = chip.findComponent({ name: 'VIcon' })
      expect(icon.exists()).toBe(true)
    })

    it('shows "(cached)" when stats.cached is true', () => {
      const wrapper = mount(SwatchGrid, {
        props: {
          swatches: sampleSwatches,
          loading: false,
          stats: { total: 3, cached: true },
        },
      })

      expect(wrapper.text()).toContain('(cached)')
    })

    it('hides "(cached)" when stats.cached is false', () => {
      const wrapper = mount(SwatchGrid, {
        props: {
          swatches: sampleSwatches,
          loading: false,
          stats: { total: 3, cached: false },
        },
      })

      expect(wrapper.text()).not.toContain('(cached)')
    })

    it('renders SwatchCard for each swatch', () => {
      const wrapper = mount(SwatchGrid, {
        props: {
          swatches: sampleSwatches,
          loading: false,
        },
      })

      const cards = wrapper.findAllComponents(SwatchCard)
      expect(cards.length).toBe(3)

      expect(cards[0].props('swatch').name).toBe('Red')
      expect(cards[1].props('swatch').name).toBe('Green')
      expect(cards[2].props('swatch').name).toBe('Blue')
    })
  })
})
