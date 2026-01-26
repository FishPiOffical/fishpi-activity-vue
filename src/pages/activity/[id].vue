<script setup lang="ts">
import { pb } from '@/api'
import type { Activity } from '@/types'
import ArticleTemplate from '@/components/activity/ArticleTemplate.vue'

// 路由参数
const route = useRoute()
const activityId = computed(() => route.params.id as string)

// 是否为 iframe 模式
const { isIframe } = useIframe()


// 数据状态
const loading = ref(true)
const error = ref<string | null>(null)
const activity = ref<Activity | null>(null)
const rewards = ref<Reward[]>([])
const articles = ref<Article[]>([])
const history = ref<YearlyHistory[]>([])

// 类型定义
interface Reward {
  id: string
  name: string
  min: number
  max: number
  point: number
  more: string
  rewardGroupId?: string
  shieldIds?: string[]
  expand?: {
    shieldIds?: Shield[]
  }
}

interface Shield {
  id: string
  name: string
  text: string
  url: string
  backcolor: string
  fontcolor: string
  ver: string
  scale: string
  size?: string
  border?: string
  barlen?: string
  fontsize?: string
  barradius?: string
  shadow?: string
  anime?: string
}

interface Article {
  id: string
  oId: string
  title: string
  viewCount: number
  goodCnt: number
  thankCnt: number
  collectCnt: number
  commentCount: number
  createdAt?: string
  created?: string
  expand?: {
    userId?: {
      name: string
      nickname: string
      avatar: string
    }
  }
}

interface YearlyHistory {
  id: string
  year: number
  keyword: string
  start: string
  end: string
  articleUrl: string
  postArticleUrl: string
  collectArticleUrl: string
  expand?: {
    articleShieldId?: Shield
    ageShieldId?: Shield
  }
}

// 获取活动数据
async function fetchActivity() {
  loading.value = true
  error.value = null

  try {
    // 获取活动详情
    const activityData = await pb.collection('activities').getOne<Activity>(activityId.value)
    activity.value = activityData
    document.title = activityData.name

    // 只有征文模板才获取数据
    if (activityData.template === 'article') {
      // 获取奖励信息（非 iframe 模式）
      if (!isIframe.value && activityData.rewardGroupId) {
        try {
          const rewardsData = await pb.collection('rewards').getList<Reward>(1, 100, {
            filter: `rewardGroupId='${activityData.rewardGroupId}'`,
            sort: 'min',
            expand: 'shieldIds',
          })
          rewards.value = rewardsData.items
        } catch (e) {
          console.error('获取奖励信息失败:', e)
        }
      }

      // 获取文章列表
      try {
        const articlesData = await pb.collection('relArticles').getList<Article>(1, 500, {
          filter: `activityId='${activityId.value}'`,
          sort: '-createdAt',
          expand: 'userId',
        })
        articles.value = articlesData.items
      } catch (e) {
        console.error('获取文章列表失败:', e)
      }

      // 获取历史回顾（非 iframe 模式）
      if (!isIframe.value) {
        try {
          const historyData = await pb.collection('yearlyHistories').getList<YearlyHistory>(1, 100, {
            sort: '-year',
            expand: 'articleShieldId,ageShieldId',
          })
          history.value = historyData.items
        } catch (e) {
          console.error('获取历史回顾失败:', e)
        }
      }
    } else {
      // 非征文模板，标记为错误状态
      error.value = '该活动模板配置不正确，请联系管理员'
    }
  } catch (e) {
    console.error('获取活动信息失败:', e)
    error.value = e instanceof Error ? e.message : '加载数据时发生错误'
  } finally {
    loading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchActivity()
})

// 监听路由参数变化
watch(activityId, () => {
  fetchActivity()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 征文模板：使用 ArticleTemplate 组件 -->
    <template v-if="activity && activity.template === 'article'">
      <ArticleTemplate
        :activity="activity"
        :rewards="rewards"
        :articles="articles"
        :history="history"
        :is-iframe="isIframe"
      />
    </template>

    <!-- 活动配置错误 -->
    <template v-else-if="error">
      <n-result status="error" title="活动配置错误" :description="error">
        <template #footer>
          <n-button type="primary" @click="$router.push('/')">返回首页</n-button>
        </template>
      </n-result>
    </template>

    <!-- 其他错误或加载状态 -->
    <template v-else>
      <n-result v-if="error" status="error" title="加载失败" :description="error">
        <template #footer>
          <n-button type="primary" @click="$router.push('/')">返回首页</n-button>
        </template>
      </n-result>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <n-spin size="large" />
      </div>
    </template>
  </div>
</template>