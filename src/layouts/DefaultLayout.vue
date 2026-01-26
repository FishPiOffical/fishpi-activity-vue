<script setup lang="ts">
import { APP_NAME } from '@/config'
import { useAppStore, useUserStore } from '@/stores'
import { ROUTE_PATHS } from '@/constants'
import { useIframe } from '@/composables'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const { isIframe } = useIframe()

// 导航菜单
const menuOptions = computed(() => {
  const items = []

  // 非首页时显示首页链接
  if (route.path !== ROUTE_PATHS.HOME) {
    items.push({
      label: '首页',
      key: 'home',
      path: ROUTE_PATHS.HOME,
    })
  }

  return items
})

// 处理菜单点击
function handleMenuSelect(key: string) {
  const item = menuOptions.value.find((i) => i.key === key)
  if (item?.path) {
    router.push(item.path)
  }
}

// 处理登录
function handleLogin() {
  userStore.goToLogin(route.fullPath)
}

// 处理登出
function handleLogout() {
  userStore.logout()
}

// 主题图标
const themeIcon = computed(() => {
  return appStore.isDark ? 'dark' : 'light'
})
</script>

<template>
  <n-layout class="min-h-screen">
    <!-- 顶部导航栏 -->
    <n-layout-header v-if="!isIframe" bordered class="fixed left-0 right-0 top-0 z-50 h-16">
      <div class="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <!-- 左侧：名称 -->
        <router-link to="/" class="flex items-center gap-2 text-lg font-semibold no-underline">
          <n-text>{{ APP_NAME }}</n-text>
        </router-link>

        <!-- 右侧：导航菜单 + 登录按钮 -->
        <div class="flex items-center gap-4">
          <!-- 导航菜单 -->
          <n-menu
            v-if="menuOptions.length > 0"
            mode="horizontal"
            :options="
              menuOptions.map((item) => ({
                label: item.label,
                key: item.key,
              }))
            "
            @update:value="handleMenuSelect"
          />

          <!-- 主题切换 -->
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button quaternary circle @click="appStore.toggleTheme">
                <template #icon>
                  <n-icon>
                    <svg
                      v-if="themeIcon === 'dark'"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M12 21q-3.75 0-6.375-2.625T3 12t2.625-6.375T12 3q.35 0 .688.025t.662.075q-1.025.725-1.638 1.888T11.1 7.5q0 2.25 1.575 3.825T16.5 12.9q1.375 0 2.525-.613T20.9 10.65q.05.325.075.662T21 12q0 3.75-2.625 6.375T12 21"
                      />
                    </svg>
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M12 17q-2.075 0-3.537-1.463T7 12t1.463-3.537T12 7t3.538 1.463T17 12t-1.463 3.538T12 17m-7-4H1v-2h4zm18 0h-4v-2h4zM11 5V1h2v4zm0 18v-4h2v4zM6.4 7.75L3.875 5.325L5.3 3.85l2.4 2.5zm12.3 12.4l-2.4-2.5l1.4-1.45l2.525 2.425zm-2.4-12.4l1.4-1.45l2.525 2.425l-1.45 1.4zM3.875 18.675l2.425-2.525l1.5 1.4l-2.5 2.4z"
                      />
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </template>
            {{ appStore.isDark ? '切换到亮色主题' : '切换到暗色主题' }}
          </n-tooltip>

          <!-- 用户信息或登录按钮 -->
          <template v-if="userStore.isLoggedIn && userStore.user">
            <n-dropdown
              trigger="click"
              :options="[{ label: '退出登录', key: 'logout' }]"
              @select="handleLogout"
            >
              <n-button quaternary class="flex items-center gap-2">
                <n-avatar :src="userStore.user.avatar" :size="28" round />
                <span>{{ userStore.user.nickname || userStore.user.name }}</span>
              </n-button>
            </n-dropdown>
          </template>
          <template v-else>
            <n-button type="primary" @click="handleLogin">登录</n-button>
          </template>
        </div>
      </div>
    </n-layout-header>

    <!-- 内容区 -->
    <n-layout-content :class="isIframe ? 'min-h-screen' : 'min-h-screen pt-16'">
      <div class="mx-auto max-w-6xl px-4 py-6">
        <router-view />
      </div>
    </n-layout-content>

    <!-- 页脚 -->
    <n-layout-footer bordered class="py-4 text-center">
      <n-text depth="3">© {{ new Date().getFullYear() }} {{ APP_NAME }} - 摸鱼派论坛</n-text>
    </n-layout-footer>
  </n-layout>
</template>
