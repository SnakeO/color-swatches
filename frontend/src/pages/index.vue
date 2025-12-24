<!--
  Home Page

  Main application page that combines HSL controls with
  the color swatch grid. Orchestrates the discovery flow.

  Flow:
    1. ColorControls emits S/L changes
    2. useSwatches fetches colors via binary search
    3. SwatchGrid displays results progressively
-->

<template>
  <v-container class="py-8" fluid>
    <!-- Page Header -->
    <h1 class="text-h4 mb-6">Color Swatches</h1>

    <!-- HSL Controls -->
    <ColorControls @change="handleControlsChange" />

    <!-- Color Grid -->
    <SwatchGrid
      :swatches="swatches"
      :loading="loading"
      :stats="stats"
    />
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useSwatches } from '@/modules/swatches/composables/useSwatches'
import ColorControls from '@/modules/swatches/components/ColorControls.vue'
import SwatchGrid from '@/modules/swatches/components/SwatchGrid.vue'
import { config } from '@/shared/config'
import type { ControlsChangeEvent } from '@/modules/swatches/types'

const { swatches, loading, stats, fetchSwatches, cleanup } = useSwatches()

function handleControlsChange({ saturation, lightness }: ControlsChangeEvent): void {
  fetchSwatches(saturation, lightness)
}

onMounted(() => {
  // Fetch initial swatches with default values
  fetchSwatches(config.defaults.saturation, config.defaults.lightness)
})

onUnmounted(() => {
  cleanup()
})
</script>
