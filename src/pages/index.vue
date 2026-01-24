<script setup lang="ts">
import type { Activity } from '@/types'
import {
  ActivityStatus,
  ACTIVITY_STATUS_CONFIG,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from '@/constants'
import { getActivityStatus, formatDate } from '@/utils'
import { activityApi } from '@/api'

const router = useRouter()

// 状态
const loading = ref(true)
const activities = ref<Activity[]>([])
const totalItems = ref(0)
const totalPages = ref(0)

// 分页
const currentPage = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)

// 筛选
const statusFilter = ref<ActivityStatus | 'all'>('all')
const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: ActivityStatus.ACTIVE },
  { label: '即将开始', value: ActivityStatus.UPCOMING },
  { label: '已结束', value: ActivityStatus.ENDED },
]

// 展开的活动描述
const expandedIds = ref<Set<string>>(new Set())

// 获取活动列表
async function fetchActivities() {
  loading.value = true
  try {
    const result = await activityApi.getActivities(currentPage.value, pageSize.value)
    activities.value = result.items
    totalItems.value = result.totalItems
    totalPages.value = result.totalPages
  } catch (error) {
    console.error('获取活动列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 筛选后的活动列表
const filteredActivities = computed(() => {
  if (statusFilter.value === 'all') {
    return activities.value
  }
  return activities.value.filter((activity) => getActivityStatus(activity) === statusFilter.value)
})

// 获取状态标签配置
function getStatusConfig(activity: Activity) {
  const status = getActivityStatus(activity)
  return ACTIVITY_STATUS_CONFIG[status]
}

// 获取状态标签类型
function getStatusType(activity: Activity): 'success' | 'warning' | 'default' | 'error' | 'info' {
  return getStatusConfig(activity).type
}

// 切换描述展开状态
function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

// 是否展开
function isExpanded(id: string) {
  return expandedIds.value.has(id)
}

// 处理分页变化
function handlePageChange(page: number) {
  currentPage.value = page
  fetchActivities()
}

// 处理每页数量变化
function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  fetchActivities()
}

// 处理筛选变化
function handleFilterChange() {
  currentPage.value = 1
}

// 打开活动页面
function openActivityPage(activity: Activity) {
  if (activity.externalUrl) {
    window.open(activity.externalUrl, '_blank')
  } else if (activity.slug) {
    router.push(`/${activity.slug}`)
  }
}

// 打开鱼排文章链接
function openArticleLink(activity: Activity) {
  if (activity.articleUrl) {
    window.open(activity.articleUrl, '_blank')
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchActivities()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 筛选栏 -->
    <div class="flex items-center justify-end">
      <n-select
        v-model:value="statusFilter"
        :options="statusOptions"
        style="width: 120px"
        @update:value="handleFilterChange"
      />
    </div>

    <!-- 加载状态 -->
    <n-spin :show="loading">
      <!-- 活动列表 -->
      <div class="space-y-4">
        <template v-if="filteredActivities.length > 0">
          <n-card
            v-for="activity in filteredActivities"
            :key="activity.id"
            :title="activity.name"
            hoverable
            class="cursor-pointer transition-shadow hover:shadow-lg"
            @click="openActivityPage(activity)"
          >
            <template #header-extra>
              <n-tag :type="getStatusType(activity)" size="small">
                {{ getStatusConfig(activity).label }}
              </n-tag>
            </template>

            <div class="space-y-4">
              <!-- 活动时间 -->
              <div class="flex flex-wrap items-center gap-4 text-sm">
                <n-text depth="3">
                  <span class="font-medium">开始时间：</span>
                  {{ formatDate(activity.start, 'datetime') }}
                </n-text>
                <n-text depth="3">
                  <span class="font-medium">结束时间：</span>
                  {{ formatDate(activity.end, 'datetime') }}
                </n-text>
              </div>

              <!-- 活动图片 -->
              <n-image
                v-if="activity.image"
                :src="activity.image"
                :alt="activity.name"
                class="max-h-48 w-full rounded object-cover"
                lazy
              />

              <!-- 活动描述 -->
              <div v-if="activity.desc" class="activity-desc">
                <n-button
                  text
                  type="primary"
                  size="small"
                  class="mb-2"
                  @click.stop.prevent="toggleExpand(activity.id)"
                >
                  {{ isExpanded(activity.id) ? '收起描述' : '展开描述' }}
                </n-button>

                <n-collapse-transition :show="isExpanded(activity.id)">
                  <div class="rounded border p-4" @click.stop.prevent>
                    <div v-html="activity.desc"></div>
                  </div>
                </n-collapse-transition>
              </div>
            </div>

            <template #action>
              <div class="flex items-center justify-between">
                <!-- 左侧：活动标签 -->
                <div class="flex items-center gap-2">
                  <n-tag v-if="activity.tag" size="small" round>
                    {{ activity.tag }}
                  </n-tag>
                </div>
                <!-- 右侧：查看推文和查看详情 -->
                <div class="flex items-center gap-2">
                  <n-button
                    v-if="activity.articleUrl"
                    text
                    type="primary"
                    size="small"
                    @click.stop="openArticleLink(activity)"
                  >
                    查看推文
                  </n-button>
                  <n-button
                    v-if="activity.externalUrl || activity.slug"
                    text
                    type="primary"
                    size="small"
                    @click.stop="openActivityPage(activity)"
                  >
                    查看详情 →
                  </n-button>
                </div>
              </div>
            </template>
          </n-card>
        </template>

        <!-- 空状态 -->
        <n-empty v-else-if="!loading" description="暂无活动" />
      </div>
    </n-spin>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="flex justify-center">
      <n-pagination
        v-model:page="currentPage"
        v-model:page-size="pageSize"
        :page-count="totalPages"
        :page-sizes="PAGE_SIZE_OPTIONS"
        show-size-picker
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.activity-desc :deep(.tox-tinymce) {
  border: none !important;
}

.activity-desc :deep(.tox .tox-edit-area__iframe) {
  background: transparent !important;
}
</style>
