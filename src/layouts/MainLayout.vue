<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useThemeStore } from '@/store/theme'
import { useRouter, useRoute } from 'vue-router'
import { FISHPI_LOGIN_URL } from '@/utils/constants'
import { pb } from '@/api/pocketbase'

const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()
const route = useRoute()

const handleLogin = () => {
    window.location.href = FISHPI_LOGIN_URL
}

const isHome = computed(() => route.path === '/' || route.name === 'index')

const menuOptions = computed(() => {
    const opts = []
    if (!isHome.value) {
        opts.push({
            label: '首页',
            key: 'home',
            props: {
                onClick: () => router.push('/')
            }
        })
    }
    return opts
})

const avatarUrl = computed(() => {
    if (userStore.user && userStore.user.avatar) {
        return pb.files.getUrl(userStore.user, userStore.user.avatar)
    }
    return ''
})

const themeOptions = [
    { label: '浅色', key: 'light', icon: () => '☀️' },
    { label: '深色', key: 'dark', icon: () => '🌙' },
    { label: '跟随系统', key: 'auto', icon: () => '💻' }
]

const handleThemeSelect = (key) => {
    themeStore.setTheme(key)
}
</script>

<template>
    <n-layout position="absolute" class="bg-gray-50 dark:bg-[#101014]">
        <!-- Fixed Header -->
        <n-layout-header bordered style="height: 64px;" class="flex items-center px-4 justify-between z-50 transition-colors duration-300">
            <div class="text-xl font-bold cursor-pointer flex items-center gap-2 select-none" @click="router.push('/')">
                <span class="text-2xl">🐟</span>
                <span class="hidden sm:block text-gray-800 dark:text-gray-100">摸鱼派活动</span>
            </div>
            <div class="flex items-center gap-4">
                <n-menu mode="horizontal" :options="menuOptions" responsive />
                
                <n-dropdown trigger="click" :options="themeOptions" @select="handleThemeSelect">
                    <n-button quaternary circle>
                        <template #icon>
                            <span v-if="themeStore.mode === 'light'">☀️</span>
                            <span v-else-if="themeStore.mode === 'dark'">🌙</span>
                            <span v-else>💻</span>
                        </template>
                    </n-button>
                </n-dropdown>

                <div v-if="userStore.user" class="flex items-center gap-3">
                    <n-avatar
round :src="avatarUrl" size="small"
                        class="border border-gray-200 dark:border-gray-700"
                        fallback-src="https://fishpi.cn/images/user-thumbnail.png" />
                    <div class="hidden sm:flex flex-col text-right leading-tight">
                        <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ userStore.user.nickname || userStore.user.name || userStore.user.username }}</span>
                    </div>
                    <n-button size="small" secondary type="error" ghost @click="userStore.logout">退出</n-button>
                </div>
                <n-button v-else type="primary" class="shadow-sm" @click="handleLogin">
                    ✨ 登录
                </n-button>
            </div>
        </n-layout-header>

        <!-- Scrollable Content Area -->
        <n-layout
position="absolute" style="top: 64px; bottom: 0;" :native-scrollbar="false"
            content-style="min-height: 100%; display: flex; flex-direction: column;"
            class="bg-gray-50 dark:bg-[#101014] transition-colors duration-300">
            <div class="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
                <div class="max-w-7xl mx-auto w-full flex-1">
                     <slot />
                </div>
                <n-layout-footer class="py-8 text-center text-gray-400 text-sm bg-transparent">
                    <p>&copy; {{ new Date().getFullYear() }} 摸鱼派论坛 - FishPi.CN</p>
                </n-layout-footer>
            </div>
        </n-layout>
    </n-layout>
</template>
