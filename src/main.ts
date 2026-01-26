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

// 全局前置守卫：处理静态 HTML 文件
router.beforeEach((to, from, next) => {
    // 如果路径以 .html 结尾，直接让浏览器加载静态文件
    if (to.path.endsWith('.html')) {
        window.location.href = to.fullPath
        return false
    }
    next()
})

// 创建应用
const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
