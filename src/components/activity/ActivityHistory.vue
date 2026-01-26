<script setup lang="ts">
import { formatDate } from '@/utils'

interface Props {
  history: YearlyHistory[]
}

defineProps<Props>()

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

// 格式化仅日期
function formatDateOnly(dateStr: string): string {
  return formatDate(dateStr, 'date')
}
</script>

<template>
  <n-card v-if="history.length > 0">
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
