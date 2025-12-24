<!--
  SwatchGrid Component

  Displays color swatches in a responsive grid layout.
  Shows loading state, empty state, or grid of SwatchCards.

  Props:
    - swatches: Array of swatch objects
    - loading: Boolean loading state
    - stats: { total, cached } discovery stats
-->

<template>
  <div>
    <!-- Empty State (not loading) -->
    <div v-if="!loading && swatches.length === 0" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-palette</v-icon>
      <div class="text-body-1 mt-4 text-grey">
        Adjust the sliders to discover color swatches
      </div>
    </div>

    <!-- Swatches Grid -->
    <div v-else>
      <!-- Stats Badge -->
      <div class="mb-4">
        <v-chip
          :color="loading ? 'warning' : 'success'"
          variant="flat"
          size="small"
        >
          <v-progress-circular
            v-if="loading"
            indeterminate
            size="14"
            width="2"
            class="mr-2"
          />
          <v-icon v-else size="small" class="mr-1">mdi-check</v-icon>
          {{ colorCount }} colors found{{ loading ? '...' : '' }}
        </v-chip>
        <span v-if="stats.cached && !loading" class="text-caption text-grey ml-2">(cached)</span>
      </div>

      <!-- Grid of SwatchCards -->
      <div class="swatch-grid">
        <!-- Initial placeholder when loading starts -->
        <SwatchCard
          v-if="loading && swatches.length === 0"
          key="initial-placeholder"
          :swatch="{ hue: 0, pending: true }"
        />
        <!-- Actual swatches -->
        <SwatchCard
          v-for="swatch in swatches"
          :key="swatch.hue"
          :swatch="swatch"
        />
        <!-- Trailing placeholder while discovering more -->
        <SwatchCard
          v-if="loading && swatches.length > 0"
          key="trailing-placeholder"
          :swatch="{ hue: 999, pending: true }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SwatchCard from './SwatchCard.vue'

const props = defineProps({
  swatches: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  stats: {
    type: Object,
    default: () => ({ total: 0, cached: false }),
  },
})

/** Count of discovered colors */
const colorCount = computed(() => props.swatches.length)
</script>

<style scoped>
.swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}
</style>
