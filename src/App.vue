<script setup lang="ts">
import { darkTheme, zhCN, dateZhCN } from 'naive-ui'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AppProvider from '@/components/AppProvider.vue'
import { useAppStore, useUserStore } from '@/stores'

const appStore = useAppStore()
const userStore = useUserStore()

// 初始化用户状态
userStore.init()

// 获取 naive-ui 主题
const theme = computed(() => (appStore.isDark ? darkTheme : null))

// 同步 dark 类到 html 元素，以便 TailwindCSS dark 模式生效
watchEffect(() => {
  if (appStore.isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-loading-bar-provider>
            <AppProvider>
              <DefaultLayout />
            </AppProvider>
          </n-loading-bar-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
