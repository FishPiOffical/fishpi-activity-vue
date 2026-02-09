<script setup lang="ts">
import { pb } from '@/api'
import type { Activity, ActivityMetadata } from '@/types'
import { useMessage, type UploadFileInfo } from 'naive-ui'
import { useUserStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const activityId = computed(() => route.query.id as string)

const loading = ref(false)
const submitting = ref(false)
const activity = ref<Activity | null>(null)

// 管理数据
const promoFileList = ref<UploadFileInfo[]>([])
const finalFileList = ref<UploadFileInfo[]>([])

// 检查登录状态和权限
const user = pb.authStore.model
const isLoggedIn = computed(() => !!user)

onMounted(async () => {
  if (!activityId.value) return
  
  if (!isLoggedIn.value || !userStore.isAdmin) {
    message.error('无权访问')
    router.push('/')
    return
  }

  await fetchActivity()
})

async function fetchActivity() {
  try {
    loading.value = true
    activity.value = await pb.collection('activities').getOne(activityId.value)
    
    // 初始化
    if (activity.value?.metadata) {
      if (activity.value.metadata.promo_image) {
          promoFileList.value = [{
            id: 'promo', status: 'finished', name: '宣传图', 
            url: pb.files.getURL(activity.value, activity.value.metadata.promo_image) 
          }]
      }
      if (activity.value.metadata.final_image) {
          finalFileList.value = [{
            id: 'final', status: 'finished', name: '成品图', 
            url: pb.files.getURL(activity.value, activity.value.metadata.final_image) 
          }]
      }
    }
  } catch (error) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!activity.value) return
  
  try {
    submitting.value = true
    
    // 拷贝当前的 metadata
    const currentMeta: any = { ...(activity.value.metadata || {}) }
    
    // 移除 admin_user_id (根据需求)
    delete currentMeta.admin_user_id

    // 1. 处理宣传图
    // 参考: https://pocketbase.io/docs/files-handling/#uploading-files
    if (promoFileList.value.length === 0) {
        delete currentMeta.promo_image
    } else {
        const newPromoFile = promoFileList.value.find(f => !f.status || f.status === 'pending')?.file
        if (newPromoFile) {
            console.log('Uploading promo image to activity:', activity.value.id)
            // 改为直接传递对象，让 SDK 处理 FormData 和 images+ 语法
            const updated = await pb.collection('activities').update(activity.value.id, {
                'images+': newPromoFile
            })
            if (updated.images && updated.images.length > 0) {
                currentMeta.promo_image = updated.images[updated.images.length - 1]
                activity.value = updated
            }
        }
    }

    // 2. 处理成品图
    if (finalFileList.value.length === 0) {
        delete currentMeta.final_image
    } else {
        const newFinalFile = finalFileList.value.find(f => !f.status || f.status === 'pending')?.file
        if (newFinalFile) {
            console.log('Uploading final image to activity:', activity.value.id)
            const updated = await pb.collection('activities').update(activity.value.id, {
                'images+': newFinalFile
            })
            if (updated.images && updated.images.length > 0) {
                currentMeta.final_image = updated.images[updated.images.length - 1]
                activity.value = updated
            }
        }
    }

    // 3. 更新 Metadata
    const finalUpdate = await pb.collection('activities').update(activity.value.id, {
        metadata: currentMeta
    })
    activity.value = finalUpdate
    
    message.success('设置已保存')
    await fetchActivity()
    
  } catch (error) {
    console.error('保存失败:', error)
    const errDetail = error instanceof Error ? error.message : JSON.stringify(error)
    message.error(`保存失败: ${errDetail}`)
  } finally {
    submitting.value = false
  }
}

</script>

<template>
  <div class="p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <n-card class="max-w-4xl mx-auto" title="⚙️ 活动高级配置">
          <template #header-extra>
              <n-button text tag="a" @click="router.push(`/activity/2026/character-show?id=${activityId}`)">返回活动页</n-button>
          </template>
          
          <n-form label-placement="left" label-width="120" v-if="activity">
              <n-divider title-placement="left">图片素材</n-divider>
              
              <n-grid cols="1 s:2" x-gap="24">
                  <n-gi>
                      <n-form-item label="活动宣传图">
                          <n-upload
                              :max="1"
                              list-type="image-card"
                              :default-file-list="promoFileList"
                              @update:file-list="v => promoFileList = v"
                          >
                              上传宣传图
                          </n-upload>
                      </n-form-item>
                  </n-gi>
                  <n-gi>
                      <n-form-item label="活动成品图">
                          <n-upload
                              :max="1"
                              list-type="image-card"
                              :default-file-list="finalFileList"
                              @update:file-list="v => finalFileList = v"
                          >
                              上传成品图
                          </n-upload>
                      </n-form-item>
                  </n-gi>
              </n-grid>
              
              <div class="flex justify-end mt-4">
                  <n-button type="primary" size="large" @click="handleSave" :loading="submitting">
                      保存所有设置
                  </n-button>
              </div>
          </n-form>
          <n-spin v-else size="large" />
      </n-card>
  </div>
</template>
