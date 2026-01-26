<script setup lang="ts">
import { pb } from '@/api'
import { getActivityStatus, formatDate } from '@/utils'
import { ACTIVITY_STATUS_CONFIG, ActivityStatus } from '@/constants'
import type { Activity } from '@/types'
import type { SelectOption } from 'naive-ui'

// 路由参数
const route = useRoute()
const activityId = computed(() => route.params.id as string)

// 是否为 iframe 模式
const { isIframe } = useIframe()

// 完整页面 URL
const fullPageUrl = computed(() => {
  return `${window.location.origin}/activity/${activityId.value}`
})

// 数据状态
const loading = ref(true)
const error = ref<string | null>(null)
const activity = ref<Activity | null>(null)
const rewards = ref<Reward[]>([])
const articles = ref<Article[]>([])
const history = ref<YearlyHistory[]>([])

// 排序
const sortBy = ref('createdAt')
const sortDesc = ref(true)
const sortOptions: SelectOption[] = [
  { label: '最新发布', value: 'createdAt' },
  { label: '浏览量', value: 'viewCount' },
  { label: '点赞数', value: 'goodCnt' },
  { label: '评论数', value: 'commentCount' },
  { label: '收藏数', value: 'collectCnt' },
  { label: '感谢数', value: 'thankCnt' },
]

// 类型定义
interface Reward {
  id: string
  name: string
  min: number
  max: number
  point: number
  more: string
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
  } catch (e) {
    console.error('获取活动信息失败:', e)
    error.value = e instanceof Error ? e.message : '加载数据时发生错误'
  } finally {
    loading.value = false
  }
}

// 获取徽章 URL
function getBadgeUrl(shield: Shield | undefined): string {
  if (!shield) return ''
  let url = `https://badge.aweoo.com/gen?ver=${shield.ver || '0.1'}&scale=${shield.scale || '0.79'}&txt=${encodeURIComponent(shield.text || '')}&backcolor=${shield.backcolor || ''}&fontcolor=${shield.fontcolor || ''}`
  if (shield.url) {
    url += `&url=${encodeURIComponent(shield.url)}`
  }
  const optionalParams = ['size', 'border', 'barlen', 'fontsize', 'barradius', 'shadow', 'anime']
  optionalParams.forEach((param) => {
    const value = shield[param as keyof Shield]
    if (value !== undefined && value !== '') {
      url += `&${param}=${value}`
    }
  })
  return url
}

// 获取用户头像
function getUserAvatar(user: Article['expand']): string {
  if (!user?.userId) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="%23E5E7EB" width="100%" height="100%" rx="8"/><text x="50%" y="50%" text-anchor="middle" dy=".35em" fill="%23999" font-family="Helvetica,Arial,sans-serif" font-size="22">?</text></svg>'
  }
  const avatar = user.userId.avatar
  if (avatar) {
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar
    if (avatar.startsWith('/')) return window.location.origin + avatar
    return avatar
  }
  const name = (user.userId.nickname || user.userId.name || 'U').trim()
  const initial = encodeURIComponent((name[0] || 'U').toUpperCase())
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%23D1FAE5' rx='8'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Helvetica,Arial,sans-serif' font-size='28' fill='%23333'>${initial}</text></svg>`
}

// 获取状态配置
function getStatusConfig(act: Activity) {
  const status = getActivityStatus(act)
  return ACTIVITY_STATUS_CONFIG[status]
}

// 获取状态标签类型
function getStatusType(act: Activity): 'success' | 'warning' | 'default' {
  const status = getActivityStatus(act)
  if (status === ActivityStatus.ACTIVE) return 'success'
  if (status === ActivityStatus.UPCOMING) return 'warning'
  return 'default'
}

// 排序文章
function sortArticles() {
  const key = sortBy.value as keyof Article
  const desc = sortDesc.value ? -1 : 1
  articles.value.sort((a, b) => {
    const aVal = a[key] ?? 0
    const bVal = b[key] ?? 0
    if (aVal < bVal) return -desc
    if (aVal > bVal) return desc
    return 0
  })
}

// 切换排序顺序
function toggleSortOrder() {
  sortDesc.value = !sortDesc.value
  sortArticles()
}

// 处理排序变化
function handleSortChange() {
  sortArticles()
}

// 格式化仅日期
function formatDateOnly(dateStr: string): string {
  return formatDate(dateStr, 'date')
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
    <!-- iframe 模式下的查看完整页面按钮 -->
    <div v-if="isIframe" class="fixed right-2 top-2 z-50">
      <n-button
        tag="a"
        :href="fullPageUrl"
        target="_blank"
        size="small"
        secondary
      >
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
        查看完整页面
      </n-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <n-spin size="large" />
    </div>

    <!-- 错误状态 -->
    <n-result v-else-if="error" status="error" title="加载失败" :description="error">
      <template #footer>
        <n-button type="primary" @click="$router.push('/')">返回首页</n-button>
      </template>
    </n-result>

    <!-- 活动内容 -->
    <template v-else-if="activity">
      <!-- 活动介绍 -->
      <n-card v-if="!isIframe" id="intro">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-xl font-bold">{{ activity.name }}</span>
            <n-tag :type="getStatusType(activity)" size="small">
              {{ getStatusConfig(activity).label }}
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

      <!-- 奖励信息 -->
      <n-card v-if="rewards.length > 0" id="rewards">
        <template #header>
          <span class="text-xl font-bold">🏆 奖励信息</span>
        </template>

        <n-data-table
          :columns="[
            { title: '名称', key: 'name', render: (row: Reward) => h('div', [h('div', { class: 'font-medium' }, row.name), row.more ? h('div', { class: 'text-xs text-gray-500 dark:text-gray-400 mt-1' }, row.more) : null]) },
            { title: '排名要求', key: 'rank', render: (row: Reward) => row.max === 0 ? '参与奖励' : row.min === row.max ? String(row.min) : `${row.min} - ${row.max}` },
            { title: '积分', key: 'point', render: (row: Reward) => h('span', { class: 'font-bold text-orange-500' }, row.point) },
            { title: '徽章', key: 'shields', render: (row: Reward) => h('div', { class: 'flex gap-2' }, row.expand?.shieldIds?.map(shield => h('img', { src: getBadgeUrl(shield), alt: '徽章', class: 'h-8', title: shield.name })) || []) },
          ]"
          :data="rewards"
          :bordered="false"
        />
      </n-card>

      <!-- 文章列表 -->
      <n-card id="articles">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <span class="text-xl font-bold">
              📝 文章列表
              <span class="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({{ articles.length }})</span>
            </span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">排序:</span>
              <n-select
                v-model:value="sortBy"
                :options="sortOptions"
                style="width: 120px"
                size="small"
                @update:value="handleSortChange"
              />
              <n-button size="small" quaternary @click="toggleSortOrder">
                {{ sortDesc ? '↓' : '↑' }}
              </n-button>
            </div>
          </div>
        </template>

        <!-- 完整模式表格 -->
        <n-data-table
          v-if="!isIframe"
          :columns="[
            { title: '标题', key: 'title', render: (row: Article) => h('div', [h('a', { href: `https://fishpi.cn/article/${row.oId}`, target: '_blank', class: 'text-gray-900 dark:text-gray-100 font-medium hover:text-blue-600' }, row.title), h('div', { class: 'text-xs text-gray-500 dark:text-gray-400 mt-1' }, formatDate(row.createdAt || row.created || '', 'datetime'))]) },
            { title: '作者', key: 'author', render: (row: Article) => h('a', { href: `https://fishpi.cn/member/${row.expand?.userId?.name || 'admin'}`, target: '_blank', class: 'flex items-center gap-2 hover:text-blue-600' }, [h('img', { src: getUserAvatar(row.expand), alt: '头像', class: 'h-8 w-8 rounded-full object-cover' }), h('span', row.expand?.userId?.nickname || row.expand?.userId?.name || '未知用户')]) },
            { title: '浏览', key: 'viewCount', align: 'right' },
            { title: '点赞', key: 'goodCnt', align: 'right' },
            { title: '感谢', key: 'thankCnt', align: 'right' },
            { title: '收藏', key: 'collectCnt', align: 'right' },
            { title: '评论', key: 'commentCount', align: 'right' },
          ]"
          :data="articles"
          :bordered="false"
        />

        <!-- iframe 模式列表 -->
        <div v-else class="space-y-3">
          <div
            v-for="article in articles"
            :key="article.id"
            class="rounded-lg border border-gray-200 p-3 transition-shadow hover:shadow-sm dark:border-gray-700"
          >
            <div class="flex items-start justify-between gap-2">
              <a
                :href="`https://fishpi.cn/article/${article.oId}`"
                target="_blank"
                class="flex-1 font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100"
              >
                {{ article.title }}
              </a>
              <span class="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                {{ formatDateOnly(article.createdAt || article.created || '') }}
              </span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <a
                :href="`https://fishpi.cn/member/${article.expand?.userId?.name || 'admin'}`"
                target="_blank"
                class="flex items-center gap-2 hover:text-blue-600"
              >
                <img
                  :src="getUserAvatar(article.expand)"
                  alt="头像"
                  class="h-6 w-6 rounded-full object-cover"
                />
                <span>{{ article.expand?.userId?.nickname || article.expand?.userId?.name || '未知用户' }}</span>
              </a>
              <div class="flex gap-3">
                <span title="浏览">👁️ {{ article.viewCount }}</span>
                <span title="点赞">👍 {{ article.goodCnt }}</span>
                <span title="感谢">🙏 {{ article.thankCnt }}</span>
                <span title="收藏">✨ {{ article.collectCnt }}</span>
                <span title="评论">💬 {{ article.commentCount }}</span>
              </div>
            </div>
          </div>
          <n-empty v-if="articles.length === 0" description="暂无文章数据" />
        </div>
      </n-card>

      <!-- 历史回顾 -->
      <n-card v-if="history.length > 0 && !isIframe" id="history">
        <template #header>
          <span class="text-xl font-bold">📜 历史回顾</span>
        </template>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            v-for="item in history"
            :key="item.id"
            class="rounded-lg border border-gray-200 bg-gray-50 p-6 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="mb-4 flex items-start justify-between">
              <div>
                <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ item.year }}年</div>
                <div v-if="item.start && item.end" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDateOnly(item.start) }} - {{ formatDateOnly(item.end) }}
                </div>
              </div>
              <n-tag type="info" size="small" round>{{ item.keyword }}</n-tag>
            </div>

            <div class="mb-4 flex flex-wrap gap-4">
              <div v-if="item.expand?.articleShieldId" class="flex flex-col items-center gap-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">年终征文</span>
                <img :src="getBadgeUrl(item.expand.articleShieldId)" alt="年终征文徽章" class="h-8" />
              </div>
              <div v-if="item.expand?.ageShieldId" class="flex flex-col items-center gap-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">年份徽章</span>
                <img :src="getBadgeUrl(item.expand.ageShieldId)" alt="年份徽章" class="h-8" />
              </div>
            </div>

            <div class="flex gap-3 border-t border-gray-200 pt-4 text-sm dark:border-gray-700">
              <n-button
                v-if="item.articleUrl"
                text
                type="primary"
                size="small"
                tag="a"
                :href="item.articleUrl"
                target="_blank"
              >
                📖 活动推文
              </n-button>
              <n-button
                v-if="item.postArticleUrl || item.collectArticleUrl"
                text
                type="primary"
                size="small"
                tag="a"
                :href="item.collectArticleUrl || item.postArticleUrl"
                target="_blank"
              >
                📊 汇总链接
              </n-button>
            </div>
          </div>
        </div>
      </n-card>
    </template>
  </div>
</template>

<style scoped>
.prose :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>
