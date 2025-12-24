<!--
  ColorControls Component

  HSL sliders for adjusting saturation and lightness values.
  Emits 'change' on slider release, text input debounce (300ms), or Enter key.

  Emits:
    - change: { saturation: number, lightness: number }

  Responsive:
    - Desktop: Label and slider inline
    - Mobile (≤sm breakpoint): Label stacks above slider
-->

<template>
  <v-card class="mb-6">
    <v-card-text>
      <v-row>
        <!-- Saturation Control -->
        <v-col cols="12" md="6">
          <div class="d-flex flex-column flex-sm-row align-start align-sm-center ga-2 ga-sm-4">
            <label class="text-body-2 text-medium-emphasis label">Saturation</label>
            <div class="d-flex align-center ga-4 flex-grow-1 w-100">
              <v-slider
                v-model="saturation"
                :min="0"
                :max="100"
                :step="1"
                thumb-label
                color="primary"
                hide-details
                class="flex-grow-1"
                @end="emitChange"
              />
              <v-text-field
                v-model.number="saturation"
                type="number"
                min="0"
                max="100"
                density="compact"
                hide-details
                suffix="%"
                class="number-input"
                @input="debouncedEmit"
                @keyup.enter="emitChange"
              />
            </div>
          </div>
        </v-col>
        <!-- Lightness Control -->
        <v-col cols="12" md="6">
          <div class="d-flex flex-column flex-sm-row align-start align-sm-center ga-2 ga-sm-4">
            <label class="text-body-2 text-medium-emphasis label">Lightness</label>
            <div class="d-flex align-center ga-4 flex-grow-1 w-100">
              <v-slider
                v-model="lightness"
                :min="0"
                :max="100"
                :step="1"
                thumb-label
                color="secondary"
                hide-details
                class="flex-grow-1"
                @end="emitChange"
              />
              <v-text-field
                v-model.number="lightness"
                type="number"
                min="0"
                max="100"
                density="compact"
                hide-details
                suffix="%"
                class="number-input"
                @input="debouncedEmit"
                @keyup.enter="emitChange"
              />
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { config } from '@/shared/config'

const emit = defineEmits<{
  change: [{ saturation: number; lightness: number }]
}>()

const saturation = ref(config.defaults.saturation)
const lightness = ref(config.defaults.lightness)

let lastEmitted: { s: number | null; l: number | null } = { s: null, l: null }
let debounceTimer: ReturnType<typeof setTimeout> | null = null

/** Debounced emit for text input */
function debouncedEmit(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(emitChange, config.ui.debounceMs)
}

function emitChange(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer) // Cancel pending debounce if Enter pressed
  }
  // Clamp values to valid range
  saturation.value = Math.max(0, Math.min(100, saturation.value || 0))
  lightness.value = Math.max(0, Math.min(100, lightness.value || 0))

  // Only emit if values changed
  if (lastEmitted.s === saturation.value && lastEmitted.l === lightness.value) {
    return
  }

  lastEmitted = { s: saturation.value, l: lightness.value }
  emit('change', { saturation: saturation.value, lightness: lightness.value })
}
</script>

<style scoped>
.label {
  min-width: 80px;
}

.number-input {
  max-width: 90px;
  flex-shrink: 0;
}
</style>
