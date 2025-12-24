<!--
  SwatchCard Component

  Displays a single color swatch with hex code overlay.
  Click to copy hex value to clipboard.
  Shows loading placeholder when swatch.pending is true.

  Props:
    - swatch: { hue, name, hex, rgb, pending? }
-->

<template>
  <div class="swatch-card" :class="{ pending: swatch.pending }" @click="handleClick">
    <!-- Pending Placeholder -->
    <template v-if="swatch.pending">
      <div class="color-block placeholder">
        <v-progress-circular indeterminate size="24" width="2" color="grey" />
      </div>
      <div class="swatch-name placeholder-text">Loading...</div>
    </template>

    <!-- Loaded Color -->
    <template v-else>
      <div class="color-block" :style="{ backgroundColor: swatch.hex }">
        <div class="swatch-hex">{{ swatch.hex }}</div>
      </div>
      <div class="swatch-name">{{ swatch.name }}</div>
    </template>
  </div>
</template>

<script setup>
import { useAppStore } from '@/shared/stores/app'

const props = defineProps({
  swatch: {
    type: Object,
    required: true,
  },
})

const appStore = useAppStore()

function handleClick() {
  if (props.swatch.pending) {
    return
  }
  copyHex()
}

async function copyHex() {
  try {
    await navigator.clipboard.writeText(props.swatch.hex)
    appStore.notifySuccess(`Copied ${props.swatch.hex}`)
  } catch {
    appStore.notifyError('Failed to copy')
  }
}
</script>

<style scoped>
.swatch-card {
  transition: transform 0.2s ease;
  cursor: pointer;
}

.swatch-card:hover {
  transform: scale(1.05);
}

.color-block {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swatch-hex {
  background: rgba(0, 0, 0, 0.3);
  padding: 6px 10px;
  border-radius: 4px;
  margin: 12px;
  color: white;
  font-size: 0.75rem;
  font-family: monospace;
}

.swatch-name {
  text-align: center;
  font-size: 0.8rem;
  margin-top: 6px;
  color: black;
}

/* Pending placeholder styles */
.pending {
  pointer-events: none;
}

.pending:hover {
  transform: none;
}

.placeholder {
  background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.placeholder-text {
  color: #999;
}
</style>
