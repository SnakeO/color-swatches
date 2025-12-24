<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
    <v-snackbar
      v-model="appStore.notification.show"
      :color="appStore.notification.color"
      :timeout="3000"
    >
      {{ appStore.notification.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { useAppStore } from './shared/stores/app'

const appStore = useAppStore()
</script>
