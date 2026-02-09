<script setup lang="ts">
import { pb } from '@/api'
import type { Activity, Article } from '@/types'
import { useUserStore } from '@/stores'
import { useMessage, useDialog, type UploadFileInfo } from 'naive-ui'
import FishpiUser from '@/components/common/FishpiUser.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()

const activityId = computed(() => route.query.id as string)

const loading = ref(false)
const submitting = ref(false)
const activity = ref<Activity | null>(null)
const userArticle = ref<Article | null>(null)
const allArticles = ref<Article[]>([]) 

const isEditing = ref(false)

// 表单数据
const formModel = reactive({
  title: '',
  content: '',
})
// Naive UI upload file list
const fileList = ref<UploadFileInfo[]>([])

const user = pb.authStore.model
const isLoggedIn = computed(() => !!user)
const isAdmin = computed(() => {
  if (userStore.isAdmin) return true
  if (!activity.value?.metadata?.admin_user_id || !user) return false
  return activity.value.metadata.admin_user_id === user.id
})

onMounted(async () => {
  if (!activityId.value) {
    message.error('无效的活动ID')
    return
  }
  await fetchActivity()
  if (isLoggedIn.value) {
    await fetchUserArticle()
  }
  await fetchAllArticles()
})

async function fetchActivity() {
  try {
    loading.value = true
    activity.value = await pb.collection('activities').getOne(activityId.value)
  } catch (error) {
    console.error('获取活动失败:', error)
    message.error('获取活动详情失败')
  } finally {
    loading.value = false
  }
}

async function fetchUserArticle() {
  if (!user) return
  try {
    const records = await pb.collection('Articles').getList<Article>(1, 1, {
      filter: `activityId = "${activityId.value}" && userId = "${user.id}"`,
    })
    if (records.items.length > 0) {
      const article = records.items[0] as Article
      userArticle.value = article
      formModel.title = article.title
      formModel.content = article.content
      
      if (article.image) {
          fileList.value = [{
              id: 'existing',
              name: 'current-image',
              status: 'finished',
              url: pb.files.getURL(article, article.image)
          }]
      }
    }
  } catch (error) {
    console.error('获取用户提交记录失败:', error)
  }
}

async function fetchAllArticles() {
  try {
    const records = await pb.collection('Articles').getFullList<Article>({
      filter: `activityId = "${activityId.value}"`,
      sort: '-created',
      expand: 'userId'
    })
    allArticles.value = records
  } catch (error) {
    console.error('获取参与列表失败:', error)
  }
}

async function handleSubmit() {
  if (!isLoggedIn.value) {
    dialog.warning({
        title: '需要登录',
        content: '请先登录后参与活动',
        positiveText: '去登录',
        onPositiveClick: () => {
             window.location.href = 'https://fishpi.cn/login'
        }
    })
    return
  }
  
  if (!formModel.title || !formModel.content) {
    message.warning('请补全角色名称和介绍')
    return
  }

  // 检查是否有新文件被选中 (status === 'finished' 是回显的旧文件)
  const newFile = fileList.value.find(f => f.status !== 'finished')?.file
  
  // 如果是首次提交，且没有新文件
  if (!userArticle.value && !newFile) {
      message.warning('请上传角色立绘')
      return
  }

  const formData = new FormData()
  formData.append('activityId', activityId.value)
  formData.append('userId', user?.id || '')
  formData.append('title', formModel.title)
  formData.append('content', formModel.content)
  
  if (newFile) {
    formData.append('image', newFile)
  }

  try {
    submitting.value = true
    if (userArticle.value) {
      await pb.collection('Articles').update(userArticle.value.id, formData)
      message.success('角色信息更新成功！')
    } else {
      await pb.collection('Articles').create(formData)
      message.success('角色投稿成功！')
    }
    await fetchUserArticle()
    isEditing.value = false
    await fetchAllArticles()
  } catch (error) {
    console.error('提交失败:', error)
    message.error(error instanceof Error ? error.message : '提交失败')
  } finally {
    submitting.value = false
  }
}

function getActivityImageUrl(filename?: string) {
  if (!activity.value || !filename) return ''
  return pb.files.getURL(activity.value, filename)
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString()
}
</script>

<template>
  <div class="character-show-page" v-if="!loading && activity">
    <!-- 头部区域 -->
    <n-card class="mb-4 text-center header-card" :bordered="false">
       <n-h1 class="mb-2 text-2xl md:text-4xl font-bold">{{ activity.name }}</n-h1>
       <n-text depth="3">{{ formatDate(activity.start) }} - {{ formatDate(activity.end) }}</n-text>
       
       <div v-if="isAdmin" class="mt-4">
          <n-button type="primary" secondary @click="router.push(`/activity/2026/character-show-admin?id=${activity.id}`)">
             管理活动配置
          </n-button>
       </div>
    </n-card>

    <div class="container mx-auto max-w-5xl px-4 pb-12 space-y-8">
        <!-- 1. 活动介绍 -->
        <n-card title="📖 活动介绍" hoverable>
            <div class="prose dark:prose-invert max-w-none" v-html="activity.desc"></div>
        </n-card>

        <!-- 2. 活动展示图 (优先展示成品图，其次宣传图) -->
        <n-card 
            v-if="activity.metadata?.final_image || activity.metadata?.promo_image"
            size="small" 
            hoverable 
            :bordered="false"
        >
            <div class="flex justify-center w-full">
              <n-image
                :src="getActivityImageUrl(activity.metadata.final_image || activity.metadata.promo_image)"
                class="rounded-md shadow-sm"
                object-fit="contain"
                :img-props="{ style: { width: '100%' } }"
              />
            </div>
        </n-card>

        <!-- 3. 个人投稿 -->
        <n-card title="📝 我的投稿" hoverable id="submission-area">
             <div v-if="!isLoggedIn" class="py-8 text-center bg-gray-50 dark:bg-gray-800 rounded">
                <n-empty description="请登录后参与活动">
                    <template #extra>
                        <n-button type="primary" tag="a" href="https://fishpi.cn/login">前往登录</n-button>
                    </template>
                </n-empty>
             </div>

             <div v-else>
                 <!-- 展示模式 -->
                 <div v-if="userArticle && !isEditing" class="flex flex-col md:flex-row gap-6">
                     <div class="w-full md:w-1/3 shrink-0">
                          <n-image
                             :src="pb.files.getURL(userArticle, userArticle.image)"
                             class="w-full rounded-lg shadow"
                             object-fit="cover" 
                           />
                     </div>
                     <div class="flex-1">
                         <h3 class="text-2xl font-bold mb-2">{{ userArticle.title }}</h3>
                         <div class="text-xs text-gray-500 mb-4">
                             提交于 {{ formatDate(userArticle.created) }}
                         </div>
                         <p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ userArticle.content }}</p>
                         
                         <div class="mt-6">
                             <n-button type="primary" secondary @click="isEditing = true">
                                 编辑投稿
                             </n-button>
                         </div>
                     </div>
                 </div>

                 <!-- 编辑/投稿模式 -->
                 <n-form v-else ref="formRef" :model="formModel" label-placement="left" label-width="80">
                     <div v-if="userArticle" class="mb-4 flex items-center justify-between">
                         <n-h3 class="m-0">编辑内容</n-h3>
                         <n-button size="small" @click="isEditing = false">取消编辑</n-button>
                     </div>
                     
                     <n-form-item label="角色名称" required>
                         <n-input v-model:value="formModel.title" placeholder="请输入您的角色名称" />
                     </n-form-item>
                     <n-form-item label="角色介绍" required>
                         <n-input v-model:value="formModel.content" type="textarea" placeholder="请详细介绍您的角色设定..." :rows="4" />
                     </n-form-item>
                     <n-form-item label="角色图片" required>
                         <div class="w-full">
                            <n-upload
                                :default-file-list="fileList"
                                list-type="image-card"
                                :max="1"
                                accept="image/*"
                                @update:file-list="v => fileList = v"
                            >
                                点击上传
                            </n-upload>
                            <n-text depth="3" class="text-xs mt-1 block">支持上传图片格式，建议尺寸 16:9 或 4:3</n-text>
                         </div>
                     </n-form-item>
                     
                     <div class="flex justify-end gap-3">
                         <n-button v-if="userArticle" @click="isEditing = false">取消</n-button>
                         <n-button type="primary" @click="handleSubmit" :loading="submitting" size="large">
                             {{ userArticle ? '保存修改' : '立即投稿' }}
                         </n-button>
                     </div>
                 </n-form>
             </div>
        </n-card>

        <!-- 4. 所有人作品 -->
        <n-divider>🎭 参演角色一览 ({{ allArticles.length }})</n-divider>
        
        <n-grid x-gap="20" y-gap="20" cols="1 s:2 m:3" responsive="screen">
            <n-gi v-for="item in allArticles" :key="item.id">
                <n-card hoverable class="h-full">
                    <template #cover>
                         <div class="h-48 overflow-hidden bg-gray-100 dark:bg-black/20 flex items-center justify-center">
                             <n-image 
                                v-if="item.image"
                                :src="pb.files.getURL(item, item.image)" 
                                object-fit="cover"
                                class="w-full h-full"
                                lazy
                             />
                             <n-empty v-else description="暂无图片" />
                         </div>
                    </template>
                    
                    <n-h3 class="mt-2 mb-1 text-lg font-bold truncate">{{ item.title }}</n-h3>
                    <div class="flex items-center gap-2 mb-3 text-sm text-gray-500">
                        <FishpiUser 
                           v-if="item.expand?.userId"
                           :name="item.expand.userId.name"
                           :nickname="item.expand.userId.nickname || item.expand.userId.name"
                           :avatar="item.expand.userId.avatar"
                           mode="normal"
                        />
                         <span class="text-xs opacity-60">{{ formatDate(item.created).split(' ')[0] }}</span>
                    </div>
                    
                    <n-p class="text-gray-600 dark:text-gray-400 line-clamp-3 text-sm mb-0">
                        {{ item.content }}
                    </n-p>
                </n-card>
            </n-gi>
        </n-grid>
        
        <n-empty v-if="allArticles.length === 0" description="暂无角色投稿，快来做第一个吧！" class="py-12" />
    </div>
  </div>
  
  <div v-else class="flex items-center justify-center h-[60vh]">
      <n-spin size="large" />
  </div>
</template>

<style scoped>
.header-card :deep(.n-card__content) {
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>
