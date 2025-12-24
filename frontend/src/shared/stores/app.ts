/**
 * App Store
 *
 * Global application state using Pinia. Manages notifications
 * displayed via Vuetify's snackbar system.
 *
 * @module shared/stores/app
 */

import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { Notification } from '@/shared/types'

export const useAppStore = defineStore('app', () => {
  /* --- Notification State --- */
  const notification: Notification = reactive({
    show: false,
    message: '',
    color: 'success',
  })

  /* --- Actions --- */

  /** Show a notification with custom color */
  function notify(message: string, color = 'success'): void {
    notification.message = message
    notification.color = color
    notification.show = true
  }

  /** Show a success notification (green) */
  function notifySuccess(message: string): void {
    notify(message, 'success')
  }

  /** Show an error notification (red) */
  function notifyError(message: string): void {
    notify(message, 'error')
  }

  return {
    notification,
    notify,
    notifySuccess,
    notifyError,
  }
})
