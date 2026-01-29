<script setup lang="ts">
/**
 * 批量创建积分记录组件
 */
import pointApi from '@/api/point'
import UserSelector from '@/components/UserSelector.vue'

interface UserItem {
  id: string
  oId: string
  name: string
  nickname: string
  avatar: string
}

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'success'): void
}>()

const message = useMessage()

// 表单数据
const selectedUsers = ref<UserItem[]>([])
const point = ref<number>(0)
const memo = ref('')
const group = ref('')

// 提交状态
const submitting = ref(false)

// 重置表单
function resetForm() {
  selectedUsers.value = []
  point.value = 0
  memo.value = ''
  group.value = ''
}

// 关闭弹窗
function handleClose() {
  emit('update:show', false)
  resetForm()
}

// 提交
async function handleSubmit() {
  if (selectedUsers.value.length === 0) {
    message.warning('请选择至少一个用户')
    return
  }
  if (point.value === 0) {
    message.warning('积分数量不能为0')
    return
  }

  submitting.value = true
  try {
    const result = await pointApi.batchCreatePoints({
      userIds: selectedUsers.value.map((u) => u.oId),
      point: point.value,
      memo: memo.value,
      group: group.value,
    })

    message.success(
      `创建完成：共 ${result.total} 人，成功 ${result.created}，跳过 ${result.skipped}，失败 ${result.failed}`
    )

    emit('success')
    handleClose()
  } catch (error) {
    console.error('创建失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    title="批量创建积分记录"
    style="width: 800px; max-height: 90vh"
    @update:show="emit('update:show', $event)"
  >
    <n-scrollbar style="max-height: calc(90vh - 150px)">
      <n-form label-placement="top">
        <n-form-item label="积分数量" required>
          <n-input-number
            v-model:value="point"
            placeholder="请输入积分数量（正数为增加，负数为扣除）"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="分组标识">
          <n-input v-model:value="group" placeholder="用于区分不同批次的积分发放（可选）" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input
            v-model:value="memo"
            type="textarea"
            placeholder="发送给用户的备注信息"
            :rows="2"
          />
        </n-form-item>
        <n-form-item label="选择用户" required>
          <UserSelector v-model:selected-users="selectedUsers" />
        </n-form-item>
      </n-form>
    </n-scrollbar>
    <template #footer>
      <n-space justify="end">
        <n-text v-if="selectedUsers.length > 0" depth="3">
          已选择 {{ selectedUsers.length }} 个用户
        </n-text>
        <n-button @click="handleClose">取消</n-button>
        <n-button
          type="primary"
          :loading="submitting"
          :disabled="selectedUsers.length === 0 || point === 0"
          @click="handleSubmit"
        >
          创建
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
