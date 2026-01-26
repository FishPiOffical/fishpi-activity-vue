<script setup lang="ts">
import type { SelectOption } from 'naive-ui'
import { formatDate } from '@/utils'
import { h, computed } from 'vue'

interface Props {
  articles: Article[]
  isIframe?: boolean
}

const props = defineProps<Props>()

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

// 排序
const sortBy = defineModel<string>('sortBy', { default: 'createdAt' })
const sortDesc = defineModel<boolean>('sortDesc', { default: true })

const sortOptions: SelectOption[] = [
  { label: '最新发布', value: 'createdAt' },
  { label: '浏览量', value: 'viewCount' },
  { label: '点赞数', value: 'goodCnt' },
  { label: '评论数', value: 'commentCount' },
  { label: '收藏数', value: 'collectCnt' },
  { label: '感谢数', value: 'thankCnt' },
]

// 排序文章
function sortArticles(articles: Article[]) {
  const key = sortBy.value as keyof Article
  const desc = sortDesc.value ? -1 : 1
  return [...articles].sort((a, b) => {
    const aVal = a[key] ?? 0
    const bVal = b[key] ?? 0
    if (aVal < bVal) return -desc
    if (aVal > bVal) return desc
    return 0
  })
}

// 计算排序后的文章
const sortedArticles = computed(() => sortArticles(props.articles))

// 切换排序顺序
function toggleSortOrder() {
  sortDesc.value = !sortDesc.value
}

// 获取用户头像
function getUserAvatar(user: Article['expand'] | undefined): string {
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

// 格式化仅日期
function formatDateOnly(dateStr: string): string {
  return formatDate(dateStr, 'date')
}
</script>

<template>
  <n-card>
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
        {
          title: '标题',
          key: 'title',
          render: (row: Article) => h('div', [
            h('a', {
              href: `https://fishpi.cn/article/${row.oId}`,
              target: '_blank',
              class: 'text-gray-900 dark:text-gray-100 font-medium hover:text-blue-600'
            }, row.title),
            h('div', {
              class: 'text-xs text-gray-500 dark:text-gray-400 mt-1'
            }, formatDate(row.createdAt || row.created || '', 'datetime'))
          ])
        },
        {
          title: '作者',
          key: 'author',
          render: (row: Article) => h('a', {
            href: `https://fishpi.cn/member/${row.expand?.userId?.name || 'admin'}`,
            target: '_blank',
            class: 'flex items-center gap-2 hover:text-blue-600'
          }, [
            h('img', {
              src: getUserAvatar(row.expand),
              alt: '头像',
              class: 'h-8 w-8 rounded-full object-cover'
            }),
            h('span', row.expand?.userId?.nickname || row.expand?.userId?.name || '未知用户')
          ])
        },
        { title: '浏览', key: 'viewCount', align: 'right' },
        { title: '点赞', key: 'goodCnt', align: 'right' },
        { title: '感谢', key: 'thankCnt', align: 'right' },
        { title: '收藏', key: 'collectCnt', align: 'right' },
        { title: '评论', key: 'commentCount', align: 'right' }
      ]"
      :data="sortedArticles"
      :bordered="false"
    />

    <!-- iframe 模式列表 -->
    <div v-else class="space-y-3">
      <div
        v-for="article in sortedArticles"
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
      <n-empty v-if="sortedArticles.length === 0" description="暂无文章数据" />
    </div>
  </n-card>
</template>