<script setup>
import { computed } from 'vue'
import Editor from '@tinymce/tinymce-vue'

// Import TinyMCE core
import 'tinymce/tinymce'
import 'tinymce/models/dom'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'

// Import skins (required for self-hosted)
import 'tinymce/skins/ui/oxide/skin.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  init: {
    type: Object,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const defaultInit = {
    license_key: 'gpl',
    // skin: false, 
    // content_css: false,
    menubar: false,
    promotion: false,
    branding: false,
}

const finalInit = computed(() => ({
    ...defaultInit,
    ...props.init,
    license_key: 'gpl',
}))

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <div class="tinymce-editor-container">
    <Editor
      :init="finalInit"
      v-model="value"
      :disabled="disabled"
    />
  </div>
</template>

<style scoped>
/* Scoped styles if needed */
.tinymce-editor-container :deep(.tox-tinymce) {
    border-radius: 4px;
}
</style>
