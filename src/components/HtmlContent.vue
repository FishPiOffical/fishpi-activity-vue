<script setup>
import TinymceEditor from '@/components/TinymceEditor.vue'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const initConf = {
    menubar: false,
    toolbar: false,
    statusbar: false,
    inline: true,
    readonly: true,
    skin: (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'oxide-dark' : 'oxide',
    content_css: (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'default',
}
</script>

<template>
  <div class="html-content-wrapper">
     <TinymceEditor
        :init="initConf"
        :model-value="content"
        disabled
      />
  </div>
</template>

<style scoped>
.html-content-wrapper :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
}
.html-content-wrapper :deep(a) {
    color: var(--n-primary-color);
}
</style>
