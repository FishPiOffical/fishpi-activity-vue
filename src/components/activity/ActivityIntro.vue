<script setup lang="ts">
import type { Activity } from '@/types'
import { getActivityStatus, formatDate } from '@/utils'
import { ACTIVITY_STATUS_CONFIG } from '@/constants'

interface Props {
  activity: Activity
  isIframe?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isIframe: false,
})

// 获取状态配置
function getStatusConfig() {
  const status = getActivityStatus(props.activity)
  return ACTIVITY_STATUS_CONFIG[status]
}

// 获取状态标签类型
function getStatusType(): 'success' | 'warning' | 'default' {
  const status = getActivityStatus(props.activity)
  if (status === 'active') return 'success'
  if (status === 'upcoming') return 'warning'
  return 'default'
}
</script>

<template>
  <n-card>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="text-xl font-bold">{{ activity.name }}</span>
        <n-tag :type="getStatusType()" size="small">
          {{ getStatusConfig().label }}
        </n-tag>
      </div>
    </template>

    <div class="space-y-4">
      <!-- 时间信息 -->
      <div class="flex flex-wrap gap-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div class="flex items-center gap-2">
          <n-icon size="20">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </n-icon>
          <span class="font-medium">开始时间:</span>
          <span>{{ formatDate(activity.start, 'datetime') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <n-icon size="20">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </n-icon>
          <span class="font-medium">结束时间:</span>
          <span>{{ formatDate(activity.end, 'datetime') }}</span>
        </div>
      </div>

      <!-- 活动描述 -->
      <div class="prose max-w-none dark:prose-invert" v-html="activity.desc"></div>

      <!-- 活动推文链接 -->
      <div v-if="activity.articleUrl" class="border-t border-gray-200 pt-4 dark:border-gray-700">
        <n-button text type="primary" tag="a" :href="activity.articleUrl" target="_blank">
          📖 查看活动推文
          <template #icon>
            <n-icon>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </n-icon>
          </template>
        </n-button>
      </div>
    </div>
  </n-card>
</template>

<style scoped>
.prose :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>
