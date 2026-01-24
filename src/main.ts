import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'
import './style.css'

// 创建 Pinia 实例
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes,
})

// 创建应用
const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
