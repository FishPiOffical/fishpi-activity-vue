<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NPagination, NTabs, NTabPane, NSkeleton, NEmpty
} from 'naive-ui'
import { getActivities } from '@/api/activity'
import { formatActivityDuration, getActivityStatus, ACTIVITY_STATUS } from '@/utils/date'
import { ACTIVITY_FIELDS } from '@/utils/constants'
import { pb } from '@/api/pocketbase'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const activities = ref([])
const page = ref(1)
const totalPages = ref(1)
const currentTab = ref('all')

const fetchActivities = async () => {
    loading.value = true
    try {
        let filter = `${ACTIVITY_FIELDS.HIDE_IN_LIST} != true`
        const now = dayjs().toISOString()

        if (currentTab.value === 'in_progress') {
             filter += ` && ${ACTIVITY_FIELDS.START} <= '${now}' && ${ACTIVITY_FIELDS.END} >= '${now}'`
        } else if (currentTab.value === 'upcoming') {
             filter += ` && ${ACTIVITY_FIELDS.START} > '${now}'`
        } else if (currentTab.value === 'ended') {
             filter += ` && ${ACTIVITY_FIELDS.END} < '${now}'`
        }

        const res = await getActivities(page.value, 10, filter)
        activities.value = res.items
        totalPages.value = res.totalPages
    } catch (e) {
        console.error('Failed to fetch activities:', e)
    } finally {
        loading.value = false
    }
}

watch([page, currentTab], () => {
    fetchActivities()
})

const onTabChange = () => {
    page.value = 1
}

onMounted(fetchActivities)

const getImgUrl = (record, filename) => {
    if (!filename) return null
    return pb.files.getUrl(record, filename)
}

const resolveStatus = (start, end) => {
    return getActivityStatus(start, end)
}

const resolveStatusProps = (status) => {
    switch (status) {
        case ACTIVITY_STATUS.IN_PROGRESS:
            return { type: 'success', label: '进行中', icon: '🔵' }
        case ACTIVITY_STATUS.NOT_STARTED:
            return { type: 'info', label: '未开始', icon: '⏳' }
        case ACTIVITY_STATUS.ENDED:
            return { type: 'default', label: '已结束', icon: '✅' }
        default: return { type: 'default', label: '未知', icon: '❓' }
    }
}

const goToDetail = (id) => {
    router.push(`/activity/${id}`)
}
</script>

<template>
  <div class="activity-page">
    <div class="page-header">
      <h1 class="page-title">鱼排活动</h1>
      <n-tabs
        type="segment"
        v-model:value="currentTab"
        @update:value="onTabChange"
        class="activity-tabs"
      >
        <n-tab-pane name="all" tab="全部" />
        <n-tab-pane name="in_progress" tab="进行中" />
        <n-tab-pane name="upcoming" tab="未开始" />
        <n-tab-pane name="ended" tab="已结束" />
      </n-tabs>
    </div>

    <!-- Loading State -->
    <div v-if="loading && activities.length === 0" class="loading-container">
      <div v-for="i in 5" :key="i" class="activity-skeleton">
        <n-skeleton height="180px" width="240px" :sharp="false" />
        <div class="skeleton-content">
          <n-skeleton text height="24px" width="60%" :repeat="1" />
          <n-skeleton text :repeat="3" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="activities.length === 0" class="empty-container">
      <n-empty description="暂无相关活动" size="large" />
    </div>

    <!-- Activity List -->
    <div v-else class="activity-list">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="activity-item"
        @click="goToDetail(activity.id)"
      >
        <!-- Left: Image -->
        <div v-if="getImgUrl(activity, activity.image)" class="activity-image">
          <img :src="getImgUrl(activity, activity.image)" :alt="activity.name" />
        </div>

        <!-- Right: Content -->
        <div class="activity-content" :class="{ 'full-width': !getImgUrl(activity, activity.image) }">
          <!-- Status Badge -->
          <div class="status-badge" :class="`status-${resolveStatus(activity.start, activity.end)}`">
            <span class="status-icon">{{ resolveStatusProps(resolveStatus(activity.start, activity.end)).icon }}</span>
            <span>{{ resolveStatusProps(resolveStatus(activity.start, activity.end)).label }}</span>
          </div>

          <!-- Title -->
          <h3 class="activity-title">{{ activity.name }}</h3>

          <!-- Time -->
          <div class="activity-time">
            <span class="time-icon">📅</span>
            <span>{{ formatActivityDuration(activity.start, activity.end) }}</span>
          </div>

          <!-- Tag -->
          <div v-if="activity.tag" class="activity-tag">
            <span class="tag-icon">🏷️</span>
            <span>{{ activity.tag }}</span>
          </div>

          <!-- Action -->
          <div class="activity-action">
            <span class="action-text">查看详情</span>
            <span class="action-arrow">→</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="activities.length > 0" class="pagination-container">
      <n-pagination v-model:page="page" :page-count="totalPages" size="large" />
    </div>
  </div>
</template>

<style>
/* Theme Variables - CSS variable overrides */
/* Light mode (default, no .dark class) */
html:not(.dark) {
  --activity-bg-color: #f5f7fa !important;
  --activity-card-bg: #ffffff !important;
  --activity-card-border: #e5e9ef !important;
  --activity-card-hover-border: #63e2b7 !important;
  --activity-shadow-light: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
  --activity-shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  --activity-divider: #e8ecf1 !important;
  --activity-text-primary: #1a1a1a !important;
  --activity-text-secondary: #666666 !important;
  --status-progress-bg: rgba(24, 160, 88, 0.12) !important;
  --status-progress-border: rgba(24, 160, 88, 0.25) !important;
  --status-progress-text: #16a34a !important;
  --status-upcoming-bg: rgba(32, 128, 240, 0.12) !important;
  --status-upcoming-border: rgba(32, 128, 240, 0.25) !important;
  --status-upcoming-text: #2563eb !important;
  --status-ended-bg: rgba(160, 160, 160, 0.1) !important;
  --status-ended-border: rgba(160, 160, 160, 0.2) !important;
  --status-ended-text: #9ca3af !important;
}

/* Dark mode */
html.dark {
  --activity-bg-color: #121212 !important;
  --activity-card-bg: #1e1e1e !important;
  --activity-card-border: #333333 !important;
  --activity-card-hover-border: #63e2b7 !important;
  --activity-shadow-light: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
  --activity-shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
  --activity-divider: #2a2a2a !important;
  --activity-text-primary: #e5e5e5 !important;
  --activity-text-secondary: #a3a3a3 !important;
  --status-progress-bg: rgba(99, 226, 183, 0.15) !important;
  --status-progress-border: rgba(99, 226, 183, 0.3) !important;
  --status-progress-text: #63e2b7 !important;
  --status-upcoming-bg: rgba(102, 178, 255, 0.15) !important;
  --status-upcoming-border: rgba(102, 178, 255, 0.3) !important;
  --status-upcoming-text: #66b2ff !important;
  --status-ended-bg: rgba(140, 140, 140, 0.15) !important;
  --status-ended-border: rgba(140, 140, 140, 0.25) !important;
  --status-ended-text: #a0a0a0 !important;
}
</style>

<style scoped>

.activity-page {
  min-height: 100%;
  padding: 40px 24px 60px;
  max-width: 1000px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 48px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 28px;
  color: var(--activity-text-primary);
  letter-spacing: -0.02em;
}

.activity-tabs {
  width: fit-content;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.activity-skeleton {
  display: flex;
  gap: 24px;
  padding: 24px;
  border-radius: 16px;
  background: var(--activity-card-bg);
  border: 1px solid var(--activity-card-border);
  box-shadow: var(--activity-shadow-light);
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 8px;
}

/* Empty State */
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100px 20px;
  background: var(--activity-card-bg);
  border-radius: 16px;
  border: 1px solid var(--activity-card-border);
  box-shadow: var(--activity-shadow-light);
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.activity-item {
  display: flex;
  background: var(--activity-card-bg);
  border: 1px solid var(--activity-card-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--activity-shadow-light);
}

.activity-item:hover {
  transform: translateY(-3px);
  box-shadow: var(--activity-shadow-hover);
  border-color: var(--activity-card-hover-border);
}

/* Activity Image */
.activity-image {
  width: 260px;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%);
}

:global(html.dark) .activity-image {
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
}

.activity-image img {
  width: 100%;
  height: 100%;
  min-height: 200px;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.activity-item:hover .activity-image img {
  transform: scale(1.06);
}

/* Activity Content */
.activity-content {
  flex: 1;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.activity-content.full-width {
  padding: 28px 28px 28px 28px;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  width: fit-content;
  letter-spacing: 0.02em;
}

.status-icon {
  font-size: 15px;
}

.status-in_progress {
  background: var(--status-progress-bg);
  color: var(--status-progress-text);
  border: 1px solid var(--status-progress-border);
}

.status-not_started {
  background: var(--status-upcoming-bg);
  color: var(--status-upcoming-text);
  border: 1px solid var(--status-upcoming-border);
}

.status-ended {
  background: var(--status-ended-bg);
  color: var(--status-ended-text);
  border: 1px solid var(--status-ended-border);
}

/* Activity Title */
.activity-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  line-height: 1.4;
  color: var(--activity-text-primary);
  letter-spacing: -0.01em;
}

/* Activity Time */
.activity-time,
.activity-tag {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--activity-text-secondary);
}

.time-icon,
.tag-icon {
  font-size: 16px;
  opacity: 0.75;
}

/* Activity Action */
.activity-action {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  color: var(--activity-card-hover-border);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.action-arrow {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateX(-4px);
}

.activity-item:hover .action-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 56px;
  padding-top: 40px;
  border-top: 1px solid var(--activity-divider);
}

/* Responsive */
@media (max-width: 768px) {
  .activity-page {
    padding: 24px 16px 40px;
  }

  .page-title {
    font-size: 28px;
    margin-bottom: 20px;
  }

  .page-header {
    margin-bottom: 32px;
  }

  .activity-item {
    flex-direction: column;
  }

  .activity-image {
    width: 100%;
    height: 180px;
  }

  .activity-content {
    padding: 24px;
  }

  .activity-content.full-width {
    padding: 24px;
  }

  .activity-title {
    font-size: 18px;
  }

  .activity-list {
    gap: 16px;
  }
}
</style>
