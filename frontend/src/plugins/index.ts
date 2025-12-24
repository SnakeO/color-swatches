import type { App } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import vuetify from './vuetify'

const routes = [
  {
    path: '/',
    component: () => import('../pages/index.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export function registerPlugins(app: App): void {
  app.use(createPinia())
  app.use(router)
  app.use(vuetify)
}
