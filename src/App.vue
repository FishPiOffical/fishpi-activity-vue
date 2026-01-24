<script setup>
import { NConfigProvider, NGlobalStyle, NMessageProvider } from 'naive-ui'
import { useThemeStore } from '@/store/theme'
import MainLayout from '@/layouts/MainLayout.vue'
import { computed } from 'vue'
import { darkTheme } from 'naive-ui'

const themeStore = useThemeStore()
const theme = computed(() => themeStore.isDark ? darkTheme : null)
</script>

<template>
  <NConfigProvider :theme="theme">
    <NGlobalStyle />
    <NMessageProvider>
      <MainLayout>
        <RouterView />
      </MainLayout>
    </NMessageProvider>
  </NConfigProvider>
</template>
