<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  NCard, NTag, NPagination, NTabs, NTabPane, NSkeleton
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
        
        const res = await getActivities(page.value, 9, filter)
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
    if (!filename) return 'https://placehold.co/600x400?text=No+Image'
    return pb.files.getUrl(record, filename)
}

const resolveStatus = (start, end) => {
    return getActivityStatus(start, end)
}

const resolveStatusProps = (status) => {
    switch (status) {
        case ACTIVITY_STATUS.IN_PROGRESS: return { type: 'success', label: '进行中' }
        case ACTIVITY_STATUS.NOT_STARTED: return { type: 'info', label: '未开始' }
        case ACTIVITY_STATUS.ENDED: return { type: 'default', label: '已结束' }
        default: return { type: 'default', label: '未知' }
    }
}

const goToDetail = (id) => {
    router.push(`/activity/${id}`)
}
</script>

<template>
  <div class="container mx-auto p-4 max-w-6xl">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">鱼排活动</h1>
    </div>

    <n-tabs type="segment" v-model:value="currentTab" @update:value="onTabChange" class="mb-8 max-w-md">
      <n-tab-pane name="all" tab="全部" />
      <n-tab-pane name="in_progress" tab="进行中" />
      <n-tab-pane name="upcoming" tab="未开始" />
      <n-tab-pane name="ended" tab="已结束" />
    </n-tabs>

    <!-- Loading Skeleton -->
    <div v-if="loading && activities.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <n-skeleton height="200px" width="100%" />
        <div class="p-4">
          <n-skeleton text :repeat="2" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="activities.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-500">
        <div class="text-6xl mb-4">🐟</div>
        <p class="text-xl">暂无相关活动</p>
    </div>

    <!-- Activity Grid -->
    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <n-card 
            v-for="activity in activities" 
            :key="activity.id" 
            class="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer activity-card"
            content-style="padding: 0;"
            @click="goToDetail(activity.id)"
          >
            <template #cover>
               <div class="h-48 overflow-hidden relative group">
                  <img 
                    :src="getImgUrl(activity, activity.image)" 
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt="Cover"
                  />
                  <div class="absolute top-2 right-2">
                      <n-tag :type="resolveStatusProps(resolveStatus(activity.start, activity.end)).type" round :bordered="false">
                          {{ resolveStatusProps(resolveStatus(activity.start, activity.end)).label }}
                      </n-tag>
                  </div>
               </div>
            </template>
            
            <div class="p-5 flex flex-col h-full">
                <h3 class="text-xl font-bold mb-3 line-clamp-2 min-h-[3.5rem]">{{ activity.name }}</h3>
                
                <div class="text-gray-500 dark:text-gray-400 text-sm mb-4 space-y-2 flex-grow">
                     <div class="flex items-center">
                        <span class="mr-2">📅</span>
                        <span>{{ formatActivityDuration(activity.start, activity.end) }}</span>
                     </div>
                     <div v-if="activity.tag" class="flex items-center ">
                        <span class="mr-2">🏷️</span>
                        <span>{{ activity.tag }}</span>
                     </div>
                </div>
            </div>
          </n-card>
      </div>

      <div class="flex justify-center mt-12 pb-8">
         <n-pagination v-model:page="page" :page-count="totalPages" size="large" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-card {
    border-radius: 12px;
    overflow: hidden;
}
</style>
