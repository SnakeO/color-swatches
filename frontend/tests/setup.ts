import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { vi, beforeEach, afterEach } from 'vitest'

// Create Vuetify instance for tests
const vuetify = createVuetify({
  components,
  directives,
})

// Register Vuetify globally for all component tests
config.global.plugins = [vuetify]

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  }),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
})

// Fresh Pinia for each test
beforeEach(() => {
  setActivePinia(createPinia())
  localStorageMock.store = {}
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
