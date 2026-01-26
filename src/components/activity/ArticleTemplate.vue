<script setup lang="ts">
import ActivityArticles from './ActivityArticles.vue'
import ActivityIntro from './ActivityIntro.vue'
import ActivityHistory from './ActivityHistory.vue'
import { computed } from 'vue'
import type { Activity } from '@/types'

interface Props {
  activity: Activity
  rewards: Reward[]
  articles: Article[]
  history: YearlyHistory[]
  isIframe?: boolean
}

const props = defineProps<Props>()

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

// iframe 模式下的查看完整页面按钮
const fullPageUrl = computed(() => {
  return window.location.origin + window.location.pathname
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

    <!-- iframe 模式下只显示文章列表 -->
    <template v-if="isIframe">
      <ActivityArticles :articles="articles" :is-iframe="true" />
    </template>

    <!-- 非iframe模式显示完整内容 -->
    <template v-else>
      <!-- 活动介绍 -->
      <ActivityIntro :activity="activity" />

      <!-- 奖励信息 -->
      <ActivityRewards :rewards="rewards" />

      <!-- 文章列表 -->
      <ActivityArticles :articles="articles" :is-iframe="false" />

      <!-- 历史回顾 -->
      <ActivityHistory :history="history" />
    </template>
  </div>
</template>
