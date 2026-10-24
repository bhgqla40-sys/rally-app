import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(Pinia.createPinia())
  return {
    app,
    // 小程序端需要把 Pinia 一起返回，uni-app 才能正确处理
    Pinia,
  }
}
