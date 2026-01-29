<script setup lang="ts">
import { useUserStore } from '@/stores'

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

// 权限检查
const isAdmin = computed(() => userStore.isAdmin)

onMounted(() => {
  if (!isAdmin.value) {
    message.error('无权访问此页面')
    router.push('/')
  }
})

// 管理菜单
const adminMenus = [
  {
    title: '勋章管理',
    description: '管理勋章的创建、编辑、授予和同步',
    icon: '🏅',
    path: '/admin/medal',
  },
  {
    title: '积分管理',
    description: '管理积分记录的创建、发放和重试',
    icon: '💰',
    path: '/admin/point',
  },
]

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div v-if="isAdmin" class="admin-index">
    <n-card title="管理中心">
      <n-grid :cols="2" :x-gap="16" :y-gap="16">
        <n-grid-item v-for="menu in adminMenus" :key="menu.path">
          <n-card hoverable class="menu-card" @click="navigateTo(menu.path)">
            <div class="menu-content">
              <span class="menu-icon">{{ menu.icon }}</span>
              <div class="menu-info">
                <h3 class="menu-title">{{ menu.title }}</h3>
                <p class="menu-desc">{{ menu.description }}</p>
              </div>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>
    </n-card>
  </div>
</template>

<style scoped>
.admin-index {
  padding: 16px;
}

.menu-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.menu-card:hover {
  transform: translateY(-4px);
}

.menu-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-icon {
  font-size: 48px;
}

.menu-info {
  flex: 1;
}

.menu-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.menu-desc {
  margin: 0;
  color: #666;
  font-size: 14px;
}
</style>
