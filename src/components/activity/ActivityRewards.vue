<script setup lang="ts">
import type { Reward } from '@/types'
import { computed, h } from 'vue'

interface Props {
  rewards: Reward[]
}

const props = defineProps<Props>()

interface RewardWithShield extends Reward {
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

// 检查是否有积分奖励
const hasPointRewards = computed(() => props.rewards.some(reward => reward.point > 0))

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
</script>

<template>
  <n-card v-if="props.rewards.length > 0">
    <template #header>
      <span class="text-xl font-bold">🏆 奖励信息</span>
    </template>

    <n-data-table
      :columns="[
        {
          title: '名称',
          key: 'name',
          render: (row: RewardWithShield) => h('div', [
            h('div', { class: 'font-medium' }, row.name),
            row.more ? h('div', { class: 'text-xs text-gray-500 dark:text-gray-400 mt-1' }, row.more) : null
          ])
        },
        {
          title: '排名要求',
          key: 'rank',
          render: (row: RewardWithShield) => row.max === 0 ? '参与奖励' : row.min === row.max ? String(row.min) : `${row.min} - ${row.max}`
        },
        ...(hasPointRewards ? [{
          title: '积分',
          key: 'point',
          render: (row: RewardWithShield) => h('span', { class: 'font-bold text-orange-500' }, row.point)
        }] : []),
        {
          title: '徽章',
          key: 'shields',
          render: (row: RewardWithShield) => h('div', { class: 'flex gap-2' },
            row.expand?.shieldIds?.map(shield => h('img', {
              src: getBadgeUrl(shield),
              alt: '徽章',
              class: 'h-8',
              title: shield.name
            })) || []
          )
        }
      ]"
      :data="rewards"
      :bordered="false"
    />
  </n-card>
</template>
