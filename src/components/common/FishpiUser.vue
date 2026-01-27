<script setup lang="ts">
import { getUserProfileUrl, getAvatarUrl } from '@/utils/fishpi'

/**
 * 用户信息展示模式
 * - mini: 只展示昵称/用户名，hover显示头像+@用户名
 * - simple: 只展示头像，hover显示nickname(@name)
 * - normal: 展示头像+昵称/用户名，hover显示@用户名
 * - full: 展示头像+上方昵称+下方@name
 */
type DisplayMode = 'mini' | 'simple' | 'normal' | 'full'

interface Props {
  /** 用户名（必填，用于跳转链接） */
  name: string
  /** 昵称（可选，不填则显示用户名） */
  nickname?: string
  /** 头像地址（可选） */
  avatar?: string
  /** 展示模式，默认 normal */
  mode?: DisplayMode
  /** 头像大小，默认根据模式自动设置 */
  avatarSize?: number
  /** 是否禁用点击跳转 */
  disableLink?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'normal',
  disableLink: false,
})

// 计算显示名称
const displayName = computed(() => props.nickname || props.name)

// 计算头像大小
const computedAvatarSize = computed(() => {
  if (props.avatarSize) return props.avatarSize
  switch (props.mode) {
    case 'simple':
      return 32
    case 'normal':
      return 28
    case 'full':
      return 40
    default:
      return 28
  }
})

// 计算头像URL
const avatarUrl = computed(() => getAvatarUrl(props.avatar || ''))

// 用户主页链接
const profileUrl = computed(() => getUserProfileUrl(props.name))

// 处理点击
function handleClick() {
  if (!props.disableLink && props.name) {
    window.open(profileUrl.value, '_blank', 'noopener,noreferrer')
  }
}
</script>

<template>
  <!-- Mini 模式：只展示昵称/用户名 -->
  <n-tooltip v-if="mode === 'mini'" placement="top">
    <template #trigger>
      <span
        class="fishpi-user fishpi-user--mini cursor-pointer hover:text-blue-500"
        @click="handleClick"
      >
        {{ displayName }}
      </span>
    </template>
    <div class="flex items-center gap-2">
      <n-avatar v-if="avatarUrl" :src="avatarUrl" :size="24" round />
      <span>@{{ name }}</span>
    </div>
  </n-tooltip>

  <!-- Simple 模式：只展示头像 -->
  <n-tooltip v-else-if="mode === 'simple'" placement="top">
    <template #trigger>
      <span class="fishpi-user fishpi-user--simple cursor-pointer" @click="handleClick">
        <n-avatar v-if="avatarUrl" :src="avatarUrl" :size="computedAvatarSize" round />
        <n-avatar v-else :size="computedAvatarSize" round>
          {{ displayName.charAt(0) }}
        </n-avatar>
      </span>
    </template>
    <span>{{ displayName }} (@{{ name }})</span>
  </n-tooltip>

  <!-- Normal 模式：展示头像+昵称/用户名 -->
  <n-tooltip v-else-if="mode === 'normal'" placement="top">
    <template #trigger>
      <span
        class="fishpi-user fishpi-user--normal inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80"
        @click="handleClick"
      >
        <n-avatar v-if="avatarUrl" :src="avatarUrl" :size="computedAvatarSize" round />
        <n-avatar v-else :size="computedAvatarSize" round>
          {{ displayName.charAt(0) }}
        </n-avatar>
        <span>{{ displayName }}</span>
      </span>
    </template>
    <span>@{{ name }}</span>
  </n-tooltip>

  <!-- Full 模式：展示头像+上方昵称+下方@name -->
  <span
    v-else-if="mode === 'full'"
    class="fishpi-user fishpi-user--full inline-flex items-center gap-2 cursor-pointer hover:opacity-80"
    @click="handleClick"
  >
    <n-avatar v-if="avatarUrl" :src="avatarUrl" :size="computedAvatarSize" round />
    <n-avatar v-else :size="computedAvatarSize" round>
      {{ displayName.charAt(0) }}
    </n-avatar>
    <div class="flex flex-col">
      <span class="font-medium leading-tight">{{ displayName }}</span>
      <span class="text-xs text-gray-500 leading-tight">@{{ name }}</span>
    </div>
  </span>
</template>

<style scoped>
.fishpi-user {
  display: inline-flex;
  align-items: center;
}
</style>
