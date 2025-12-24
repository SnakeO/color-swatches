import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ColorControls from '@/modules/swatches/components/ColorControls.vue'

vi.mock('@/shared/config', () => ({
  config: {
    defaults: {
      saturation: 100,
      lightness: 50,
    },
    ui: {
      debounceMs: 300,
    },
  },
}))

describe('ColorControls', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('renders with default saturation value', () => {
      const wrapper = mount(ColorControls)

      const inputs = wrapper.findAll('input[type="number"]')
      const saturationInput = inputs[0]

      expect(saturationInput.element.value).toBe('100')
    })

    it('renders with default lightness value', () => {
      const wrapper = mount(ColorControls)

      const inputs = wrapper.findAll('input[type="number"]')
      const lightnessInput = inputs[1]

      expect(lightnessInput.element.value).toBe('50')
    })
  })

  describe('slider interaction', () => {
    it('emits change on slider release', async () => {
      const wrapper = mount(ColorControls)

      const sliders = wrapper.findAllComponents({ name: 'VSlider' })
      const saturationSlider = sliders[0]

      await saturationSlider.vm.$emit('end')
      await flushPromises()

      expect(wrapper.emitted('change')).toBeTruthy()
    })

    it('includes correct saturation and lightness', async () => {
      const wrapper = mount(ColorControls)

      const sliders = wrapper.findAllComponents({ name: 'VSlider' })
      await sliders[0].vm.$emit('end')
      await flushPromises()

      const emitted = wrapper.emitted('change')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual({
        saturation: 100,
        lightness: 50,
      })
    })
  })

  describe('text input', () => {
    it('debounces input for 300ms', async () => {
      const wrapper = mount(ColorControls)

      const inputs = wrapper.findAll('input[type="number"]')
      const saturationInput = inputs[0]

      await saturationInput.setValue(80)
      await saturationInput.trigger('input')

      expect(wrapper.emitted('change')).toBeFalsy()

      vi.advanceTimersByTime(299)
      expect(wrapper.emitted('change')).toBeFalsy()

      vi.advanceTimersByTime(2)
      await flushPromises()
      expect(wrapper.emitted('change')).toBeTruthy()
    })

    it('emits immediately on Enter key', async () => {
      const wrapper = mount(ColorControls)

      const inputs = wrapper.findAll('input[type="number"]')
      const saturationInput = inputs[0]

      await saturationInput.setValue(75)
      await saturationInput.trigger('keyup.enter')
      await flushPromises()

      expect(wrapper.emitted('change')).toBeTruthy()
      expect(wrapper.emitted('change')![0][0]).toEqual({
        saturation: 75,
        lightness: 50,
      })
    })

    it('cancels debounce on Enter', async () => {
      const wrapper = mount(ColorControls)

      const inputs = wrapper.findAll('input[type="number"]')
      const saturationInput = inputs[0]

      await saturationInput.setValue(60)
      await saturationInput.trigger('input')
      await saturationInput.trigger('keyup.enter')
      await flushPromises()

      expect(wrapper.emitted('change')?.length).toBe(1)

      vi.advanceTimersByTime(500)
      await flushPromises()

      expect(wrapper.emitted('change')?.length).toBe(1)
    })
  })

  describe('value clamping', () => {
    it('clamps negative values to 0', async () => {
      const wrapper = mount(ColorControls)

      const inputs = wrapper.findAll('input[type="number"]')
      const saturationInput = inputs[0]

      await saturationInput.setValue(-10)
      await saturationInput.trigger('keyup.enter')
      await flushPromises()

      const emitted = wrapper.emitted('change')
      expect(emitted![0][0]).toEqual({
        saturation: 0,
        lightness: 50,
      })
    })

    it('clamps values > 100 to 100', async () => {
      const wrapper = mount(ColorControls)

      const inputs = wrapper.findAll('input[type="number"]')
      const saturationInput = inputs[0]

      await saturationInput.setValue(150)
      await saturationInput.trigger('keyup.enter')
      await flushPromises()

      const emitted = wrapper.emitted('change')
      expect(emitted![0][0]).toEqual({
        saturation: 100,
        lightness: 50,
      })
    })

    it('handles empty input as 0', async () => {
      const wrapper = mount(ColorControls)

      const inputs = wrapper.findAll('input[type="number"]')
      const lightnessInput = inputs[1]

      await lightnessInput.setValue('')
      await lightnessInput.trigger('keyup.enter')
      await flushPromises()

      const emitted = wrapper.emitted('change')
      expect(emitted![0][0]).toEqual({
        saturation: 100,
        lightness: 0,
      })
    })
  })

  describe('duplicate prevention', () => {
    it('does not emit if values unchanged', async () => {
      const wrapper = mount(ColorControls)

      const sliders = wrapper.findAllComponents({ name: 'VSlider' })

      await sliders[0].vm.$emit('end')
      await flushPromises()

      expect(wrapper.emitted('change')?.length).toBe(1)

      await sliders[0].vm.$emit('end')
      await flushPromises()

      expect(wrapper.emitted('change')?.length).toBe(1)
    })
  })
})
