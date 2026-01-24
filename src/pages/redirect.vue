<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { verifyFishpiLogin } from '@/api/fishpi'
import { useUserStore } from '@/store/user'
import { useMessage } from 'naive-ui'
import { useIntervalFn } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const message = useMessage()

const loading = ref(true)
const error = ref(null)
const countdown = ref(5)
const redirectUrl = ref('/')

const { pause, resume } = useIntervalFn(() => {
  countdown.value--
  if (countdown.value <= 0) {
    pause()
    doRedirect()
  }
}, 1000, { immediate: false })

const doRedirect = () => {
  if (redirectUrl.value.startsWith('http')) {
     window.location.href = redirectUrl.value
  } else {
     router.push(redirectUrl.value)
  }
}

onMounted(async () => {
  const { id, redirect } = route.query
  if (redirect) {
      redirectUrl.value = redirect
  }
  
  // Clean URL params without refresh
  try {
    const url = new URL(window.location)
    url.searchParams.delete('id')
    url.searchParams.delete('redirect')
    window.history.replaceState({}, '', url)
  } catch (e) {
    console.warn('History replace failed', e)
  }

  if (!id) {
    loading.value = false
    error.value = 'Missing login ID param'
    return
  }

  try {
    const res = await verifyFishpiLogin(id)
    // res should contain { token, user }
    if (res.token && res.user) {
        userStore.login(res.token, res.user)
        message.success('登录成功')
        resume() // start countdown
    } else {
        throw new Error('Invalid response format')
    }
  } catch (err) {
    console.error(err)
    error.value = err.message || 'Login verification failed'
    // Ensure we don't start countdown on error
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto mt-20 border border-gray-100 dark:border-gray-700">
    <n-spin :show="loading">
       <template #description>正在验证登录...</template>
       <div v-if="error" class="text-center">
          <div class="text-red-500 text-6xl mb-4">✗</div>
          <h2 class="text-xl font-bold mb-2">登录失败</h2>
          <p class="text-gray-500 mb-4">{{ error }}</p>
          <n-button @click="router.push('/')">返回首页</n-button>
       </div>
       <div v-else-if="!loading" class="text-center">
          <div class="text-green-500 text-6xl mb-4">✓</div>
          <h2 class="text-xl font-bold mb-2">登录成功</h2>
          <p class="text-gray-500 mb-4">欢迎回来，{{ userStore.user?.nickname || userStore.user?.username }}</p>
          <div class="mb-6 text-2xl font-mono">
             {{ countdown }}s
          </div>
          <div class="flex gap-4 justify-center">
             <n-button type="primary" @click="doRedirect">立即跳转</n-button>
          </div>
       </div>
       <!-- Empty div for loading state to take up space -->
       <div v-else class="h-40 w-60"></div>
    </n-spin>
  </div>
</template>
