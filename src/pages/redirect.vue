<script setup lang="ts">
import { verifyLogin } from '@/api/fishpi'
import { REDIRECT_COUNTDOWN, ROUTE_PATHS } from '@/constants'
import { useUserStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const message = useMessage()

// 状态
const loading = ref(true)
const error = ref<string | null>(null)
const countdown = ref(REDIRECT_COUNTDOWN)
const redirectPath = ref<string>(ROUTE_PATHS.HOME)

// 从 URL 获取参数
const id = computed(() => route.query.id as string | undefined)
const redirect = computed(() => (route.query.redirect as string) || ROUTE_PATHS.HOME)

// 验证登录
async function verify() {
  if (!id.value) {
    error.value = '缺少必要的登录参数'
    loading.value = false
    return
  }

  try {
    // 清除 URL 中的参数
    const cleanUrl = window.location.pathname
    window.history.replaceState({}, '', cleanUrl)

    // 设置重定向路径
    redirectPath.value = redirect.value

    // 调用验证接口
    const result = await verifyLogin(id.value)

    // 更新用户状态
    userStore.setUser(result.user)

    message.success('登录成功')
    loading.value = false

    // 开始倒计时
    startCountdown()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录验证失败'
    loading.value = false
  }
}

// 开始倒计时
function startCountdown() {
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      goToRedirect()
    }
  }, 1000)
}

// 跳转到目标页面
function goToRedirect() {
  router.push(redirectPath.value)
}

// 返回首页
function goHome() {
  router.push(ROUTE_PATHS.HOME)
}

// 页面加载时执行验证
onMounted(() => {
  verify()
})
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <n-card class="w-full max-w-md">
      <!-- 加载中 -->
      <template v-if="loading">
        <div class="flex flex-col items-center gap-4 py-8">
          <n-spin size="large" />
          <n-text>正在验证登录状态...</n-text>
        </div>
      </template>

      <!-- 错误 -->
      <template v-else-if="error">
        <n-result status="error" title="登录失败" :description="error">
          <template #footer>
            <n-button type="primary" @click="goHome">返回首页</n-button>
          </template>
        </n-result>
      </template>

      <!-- 成功 -->
      <template v-else-if="userStore.user">
        <n-result status="success" title="登录成功">
          <template #icon>
            <n-avatar :src="userStore.user.avatar" :size="80" round />
          </template>
          <template #default>
            <div class="flex flex-col items-center gap-2">
              <n-text class="text-xl font-semibold">
                {{ userStore.user.nickname || userStore.user.name }}
              </n-text>
              <n-text depth="3">@{{ userStore.user.name }}</n-text>
            </div>
          </template>
          <template #footer>
            <div class="flex flex-col items-center gap-4">
              <n-text depth="3">{{ countdown }} 秒后自动跳转</n-text>
              <n-button type="primary" @click="goToRedirect">立即跳转</n-button>
            </div>
          </template>
        </n-result>
      </template>
    </n-card>
  </div>
</template>
