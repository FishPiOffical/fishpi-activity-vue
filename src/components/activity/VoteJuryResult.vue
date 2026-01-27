<script setup lang="ts">
import { voteJuryApi } from '@/api'
import type {
  GetResultResponse,
  JuryStatus,
} from '@/types'
import { useUserStore } from '@/stores'

interface Props {
  voteId: string
  isIframe?: boolean
}

const props = defineProps<Props>()
const message = useMessage()
const userStore = useUserStore()

// 数据状态
const loading = ref(true)
const error = ref<string | null>(null)
const resultData = ref<GetResultResponse | null>(null)

// 申请相关
const applyReason = ref('')
const applyLoading = ref(false)
const showApplyModal = ref(false)

// 状态映射
const statusMap: Record<JuryStatus, string> = {
  pending: '未开启',
  applying: '申请中',
  publicity: '公示中',
  voting: '评审中',
  completed: '计票完成',
}

// 状态颜色映射
const statusColorMap: Record<JuryStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  pending: 'default',
  applying: 'info',
  publicity: 'warning',
  voting: 'success',
  completed: 'error',
}

// 获取投票结果
async function fetchResult() {
  loading.value = true
  error.value = null

  try {
    resultData.value = await voteJuryApi.getResult(props.voteId)
  } catch (e) {
    console.error('获取投票结果失败:', e)
    error.value = e instanceof Error ? e.message : '加载数据时发生错误'
  } finally {
    loading.value = false
  }
}

// 申请加入评审团
async function handleApply() {
  if (!userStore.isLoggedIn) {
    userStore.goToLogin()
    return
  }

  applyLoading.value = true
  try {
    await voteJuryApi.applyJury({
      voteId: props.voteId,
      reason: applyReason.value,
    })
    message.success('申请提交成功')
    showApplyModal.value = false
    applyReason.value = ''
  } catch (e) {
    message.error(e instanceof Error ? e.message : '申请失败')
  } finally {
    applyLoading.value = false
  }
}

// 检查当前用户是否是评审团成员
const isJuryMember = computed(() => {
  if (!userStore.user || !resultData.value) return false
  return resultData.value.members.some(m => m.id === userStore.user?.id)
})

onMounted(() => {
  fetchResult()
})

watch(() => props.voteId, () => {
  fetchResult()
})
</script>

<template>
  <n-card class="vote-jury-result">
    <template #header>
      <div class="flex items-center justify-between">
        <span>评审团投票</span>
        <n-tag v-if="resultData" :type="statusColorMap[resultData.status]">
          {{ statusMap[resultData.status] }}
          <template v-if="resultData.currentRound > 1">
            (第 {{ resultData.currentRound }} 轮)
          </template>
        </n-tag>
      </div>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-10">
      <n-spin size="medium" />
    </div>

    <!-- 错误状态 -->
    <n-result v-else-if="error" status="error" :description="error" />

    <!-- 主内容 -->
    <template v-else-if="resultData">
      <!-- 评审团成员 -->
      <div class="mb-4">
        <h4 class="text-base font-medium mb-2">评审团成员 ({{ resultData.members.length }}人)</h4>
        <n-space>
          <n-tooltip v-for="member in resultData.members" :key="member.id">
            <template #trigger>
              <n-avatar :src="member.avatar" :size="40" round />
            </template>
            {{ member.nickname }} (@{{ member.name }})
          </n-tooltip>
        </n-space>
      </div>

      <!-- 申请按钮（申请阶段且未登录或非成员时显示） -->
      <div v-if="resultData.status === 'applying' && !isJuryMember" class="mb-4">
        <n-button type="primary" @click="showApplyModal = true">
          申请加入评审团
        </n-button>
      </div>

      <!-- 投票区域（投票阶段且是评审团成员时显示） -->
      <template v-if="resultData.status === 'voting' && isJuryMember">
        <n-divider />
        <div class="mb-4">
          <h4 class="text-base font-medium mb-2">投票</h4>
          <n-alert type="info" class="mb-2">
            请选择您要投票的用户
          </n-alert>
          <!-- 这里需要根据实际情况展示候选人列表 -->
          <n-empty description="请在活动页面查看候选人并投票" />
        </div>
      </template>

      <!-- 投票结果 -->
      <template v-if="resultData.results && resultData.results.length > 0">
        <n-divider />
        <div>
          <h4 class="text-base font-medium mb-2">投票结果</h4>
          <n-collapse default-expanded-names="1">
            <n-collapse-item
              v-for="round in resultData.results"
              :key="round.round"
              :title="`第 ${round.round} 轮`"
              :name="String(round.round)"
            >
              <template #header-extra>
                <n-tag v-if="round.continue" type="warning" size="small">进入下一轮</n-tag>
                <n-tag v-else type="success" size="small">已完成</n-tag>
              </template>

              <div class="space-y-2">
                <div
                  v-for="(item, index) in [...round.results].sort((a, b) => b.count - a.count)"
                  :key="item.userId"
                  class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <div class="flex items-center gap-2">
                    <span class="w-6 text-center font-bold">{{ index + 1 }}</span>
                    <n-avatar v-if="item.user" :src="item.user.avatar" :size="28" round />
                    <span>{{ item.user?.nickname || item.userId }}</span>
                    <n-tag
                      v-if="round.continue && round.userIds.includes(item.userId)"
                      type="info"
                      size="small"
                    >
                      进入下一轮
                    </n-tag>
                  </div>
                  <n-tag type="primary">{{ item.count }} 票</n-tag>
                </div>
              </div>
            </n-collapse-item>
          </n-collapse>
        </div>
      </template>

      <!-- 无结果 -->
      <n-empty
        v-else-if="resultData.status === 'completed'"
        description="暂无投票结果"
      />
    </template>

    <!-- 申请弹窗 -->
    <n-modal v-model:show="showApplyModal" preset="dialog" title="申请加入评审团">
      <n-form>
        <n-form-item label="申请理由">
          <n-input
            v-model:value="applyReason"
            type="textarea"
            placeholder="请输入您的申请理由（可选）"
            :rows="3"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showApplyModal = false">取消</n-button>
        <n-button type="primary" :loading="applyLoading" @click="handleApply">
          提交申请
        </n-button>
      </template>
    </n-modal>
  </n-card>
</template>

<style scoped>
.vote-jury-result {
  margin-bottom: 1rem;
}
</style>
