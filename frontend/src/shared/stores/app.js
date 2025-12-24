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

export const useAppStore = defineStore('app', () => {
  /* --- Notification State --- */
  const notification = reactive({
    show: false,
    message: '',
    color: 'success',
  })

  /* --- Actions --- */

  /** Show a notification with custom color */
  function notify(message, color = 'success') {
    notification.message = message
    notification.color = color
    notification.show = true
  }

  /** Show a success notification (green) */
  function notifySuccess(message) {
    notify(message, 'success')
  }

  /** Show an error notification (red) */
  function notifyError(message) {
    notify(message, 'error')
  }

  return {
    notification,
    notify,
    notifySuccess,
    notifyError,
  }
})
