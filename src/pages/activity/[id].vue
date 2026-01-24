<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getActivity } from '@/api/activity'
import { pb } from '@/api/pocketbase'
import { formatActivityDuration, getActivityStatus, ACTIVITY_STATUS } from '@/utils/date'
import HtmlContent from '@/components/HtmlContent.vue'
import { NButton, NTag, NSkeleton } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const activity = ref(null)
const loading = ref(true)

onMounted(async () => {
    try {
        activity.value = await getActivity(route.params.id)
    } catch (e) {
        console.error('Failed to load activity', e)
    } finally {
        loading.value = false
    }
})

const getImgUrl = (record, filename) => {
    if (!filename) return null
    return pb.files.getUrl(record, filename)
}

const resolveStatusProps = (status) => {
    switch (status) {
        case ACTIVITY_STATUS.IN_PROGRESS: return { type: 'success', label: '进行中' }
        case ACTIVITY_STATUS.NOT_STARTED: return { type: 'info', label: '未开始' }
        case ACTIVITY_STATUS.ENDED: return { type: 'default', label: '已结束' }
        default: return { type: 'default', label: '未知' }
    }
}
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <div class="mb-4">
        <n-button text @click="router.back()">
        &laquo; 返回列表
        </n-button>
    </div>

    <div v-if="loading">
       <n-skeleton height="400px" width="100%" class="mb-8 rounded-lg" />
       <div class="p-4 space-y-4">
         <n-skeleton height="40px" width="60%" />
         <n-skeleton text :repeat="5" />
       </div>
    </div>

    <div v-else-if="activity" class="bg-white dark:bg-[#18181c] rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <!-- Banner -->
        <div v-if="activity.image" class="w-full h-64 md:h-96 relative bg-gray-100 dark:bg-gray-800">
            <img :src="getImgUrl(activity, activity.image)" class="w-full h-full object-cover" alt="Banner" />
            <div class="absolute top-4 right-4">
                 <n-tag :type="resolveStatusProps(getActivityStatus(activity.start, activity.end)).type" size="large" round :bordered="false">
                    {{ resolveStatusProps(getActivityStatus(activity.start, activity.end)).label }}
                 </n-tag>
            </div>
        </div>
        
        <!-- Header if no image -->
        <div v-else class="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
             <div class="text-xl font-bold">详情</div>
             <n-tag :type="resolveStatusProps(getActivityStatus(activity.start, activity.end)).type" size="large" round>
                    {{ resolveStatusProps(getActivityStatus(activity.start, activity.end)).label }}
             </n-tag>
        </div>

        <div class="p-6 md:p-10">
            <h1 class="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100">{{ activity.name }}</h1>
            
            <div class="flex flex-wrap gap-6 text-gray-500 mb-10 items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div class="flex items-center">
                    <span class="mr-2 text-xl">📅</span>
                    <span class="font-medium">{{ formatActivityDuration(activity.start, activity.end) }}</span>
                </div>
                <div v-if="activity.tag" class="flex items-center">
                    <span class="mr-2 text-xl">🏷️</span>
                    <n-tag :bordered="false" type="primary" size="small">{{ activity.tag }}</n-tag>
                </div>
            </div>

            <!-- Content -->
            <div class="mb-10">
                <HtmlContent :content="activity.desc" />
            </div>

            <!-- Actions -->
            <div class="flex gap-4 pt-8 border-t dark:border-gray-700">
                <n-button v-if="activity.articleUrl" tag="a" :href="activity.articleUrl" target="_blank" type="primary" size="large">
                    查看原文
                </n-button>
                <n-button v-if="activity.externalUrl" tag="a" :href="activity.externalUrl" target="_blank" secondary type="info" size="large">
                    活动链接
                </n-button>
            </div>
        </div>
    </div>
    
    <div v-else class="text-center py-20 text-gray-500">
        <div class="text-4xl mb-4">🤔</div>
        <p>找不到该活动</p>
    </div>
  </div>
</template>
