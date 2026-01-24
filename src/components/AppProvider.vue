<script setup lang="ts">
import { setMessageApi, setFishpiMessageApi } from '@/api'

// 在 provider 内部获取 message API
const message = useMessage()
setMessageApi(message)
setFishpiMessageApi(message)
</script>

<template>
  <slot />
</template>
