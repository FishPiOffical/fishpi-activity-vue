<script setup lang="ts">
import { setMessageApi, setFishpiMessageApi, setMedalMessageApi } from '@/api'

// 在 provider 内部获取 message API
const message = useMessage()
setMessageApi(message)
setFishpiMessageApi(message)
setMedalMessageApi(message)
</script>

<template>
  <slot />
</template>
