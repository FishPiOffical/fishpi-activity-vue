<script setup lang="ts">
import { voteJuryApi } from '@/api'
import type {
  GetResultResponse,
  JuryStatus,
  GetMyApplyResponse,
  GetCandidatesResponse,
} from '@/types'
import { useUserStore } from '@/stores'
import { getArticleUrl } from '@/utils/fishpi'
import FishpiUser from '@/components/common/FishpiUser.vue'

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
const myApplyData = ref<GetMyApplyResponse | null>(null)
const candidatesData = ref<GetCandidatesResponse | null>(null)

// 申请相关
const applyReason = ref('')
const applyLoading = ref(false)
const showApplyModal = ref(false)

// 投票相关
const voteLoading = ref(false)
const showVoteModal = ref(false)
const cancelVoteLoading = ref(false)

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

// 格式化时间
function formatDateTime(dateStr: string): string {
  if (!dateStr || dateStr === '0001-01-01 00:00:00.000Z') return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取申请状态文本
function getApplyStatusText(status: string): string {
  switch (status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return status
  }
}

// 获取申请状态颜色
function getApplyStatusType(status: string): 'default' | 'warning' | 'success' | 'error' {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'error'
    default: return 'default'
  }
}

// 获取投票结果
async function fetchResult() {
  loading.value = true
  error.value = null

  try {
    resultData.value = await voteJuryApi.getResult(props.voteId)

    // 如果已登录，获取我的申请记录
    if (userStore.isLoggedIn) {
      try {
        myApplyData.value = await voteJuryApi.getMyApply(props.voteId)
      } catch (e) {
        console.error('获取申请记录失败:', e)
      }

      // 如果是评审中状态且是成员，获取候选人列表
      if (resultData.value.status === 'voting' && myApplyData.value?.isMember) {
        try {
          candidatesData.value = await voteJuryApi.getCandidates(props.voteId)
        } catch (e) {
          console.error('获取候选人列表失败:', e)
        }
      }
    }
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
    await fetchResult()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '申请失败')
  } finally {
    applyLoading.value = false
  }
}

// 投票
async function handleVote(toUserId: string) {
  if (!userStore.isLoggedIn) {
    userStore.goToLogin()
    return
  }

  voteLoading.value = true
  try {
    const result = await voteJuryApi.juryVote({
      voteId: props.voteId,
      toUserId,
    })
    message.success(`投票成功，剩余票数: ${result.remaining}`)
    // 重新获取候选人列表更新状态
    candidatesData.value = await voteJuryApi.getCandidates(props.voteId)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '投票失败')
  } finally {
    voteLoading.value = false
  }
}

// 撤销投票
async function handleCancelVote(toUserId: string) {
  cancelVoteLoading.value = true
  try {
    const result = await voteJuryApi.cancelVote({
      voteId: props.voteId,
      toUserId,
    })
    message.success(result.message)
    // 重新获取候选人列表更新状态
    candidatesData.value = await voteJuryApi.getCandidates(props.voteId)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '撤销投票失败')
  } finally {
    cancelVoteLoading.value = false
  }
}

// 检查当前用户是否是评审团成员
const isJuryMember = computed(() => {
  return myApplyData.value?.isMember ?? false
})

// 检查是否已有待审核的申请
const hasPendingApply = computed(() => {
  return myApplyData.value?.applies.some(a => a.status === 'pending') ?? false
})

// 检查是否可以显示申请按钮
const canShowApplyButton = computed(() => {
  return resultData.value?.status === 'applying' &&
         !isJuryMember.value &&
         !hasPendingApply.value &&
         userStore.isLoggedIn
})

// 检查某个候选人是否可以投票
function canVoteForCandidate(userId: string): boolean {
  if (!candidatesData.value) return false

  // 如果票数已用完
  if (candidatesData.value.remainingVotes <= 0) return false

  // 如果不允许重复投票且已经投过
  if (!candidatesData.value.allowRepeat && candidatesData.value.votedUsers[userId]) {
    return false
  }

  return true
}

// 计算弃票人数
function getAbstainCount(round: { votedCount: number; totalMembers?: number }): number {
  const total = round.totalMembers ?? resultData.value?.totalMembers ?? 0
  return total - round.votedCount
}

// 获取进入下一轮的用户名称列表
function getNextRoundUserNames(round: { userIds: string[]; results: { userId: string; user: { nickname?: string } | null }[] }): string {
  if (!round.userIds || round.userIds.length === 0) return ''
  const names: string[] = round.userIds.map((userId: string) => {
    const item = round.results.find(r => r.userId === userId)
    return item?.user?.nickname || userId
  })
  return names.join('、')
}

// 获取获胜者名称
function getWinnerName(round: { userIds: string[]; results: { userId: string; user: { nickname?: string } | null }[] }): string {
  if (!round.userIds || round.userIds.length === 0) return '未知'
  const winnerId = round.userIds[0] as string
  const item = round.results.find(r => r.userId === winnerId)
  return item?.user?.nickname || winnerId
}

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
          <FishpiUser
            v-for="member in resultData.members"
            :key="member.id"
            :name="member.name"
            :nickname="member.nickname"
            :avatar="member.avatar"
            mode="simple"
            :avatar-size="40"
          />
        </n-space>
      </div>

      <!-- 我的申请记录（仅申请阶段显示） -->
      <template v-if="resultData.status === 'applying' && myApplyData && myApplyData.applies.length > 0">
        <n-divider />
        <div class="mb-4">
          <h4 class="text-base font-medium mb-2">我的申请记录</h4>
          <div class="space-y-2">
            <div
              v-for="apply in myApplyData.applies"
              :key="apply.id"
              class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <div class="flex items-center gap-2">
                <n-tag :type="getApplyStatusType(apply.status)" size="small">
                  {{ getApplyStatusText(apply.status) }}
                </n-tag>
                <span class="text-sm text-gray-500">{{ apply.reason || '无申请理由' }}</span>
              </div>
              <span class="text-sm text-gray-400">{{ formatDateTime(apply.created) }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 申请按钮 -->
      <div v-if="canShowApplyButton" class="mb-4">
        <n-button type="primary" @click="showApplyModal = true">
          申请加入评审团
        </n-button>
      </div>

      <!-- 投票按钮（投票阶段且是评审团成员时显示） -->
      <template v-if="resultData.status === 'voting' && isJuryMember && candidatesData && !resultData.isVoteCompleted">
        <n-divider />
        <div class="mb-4">
          <div class="flex items-center justify-between">
            <h4 class="text-base font-medium">
              我的投票
              <n-tag type="info" size="small" class="ml-2">
                已用 {{ candidatesData.usedVotes }} / {{ candidatesData.totalVotes }} 票
              </n-tag>
            </h4>
            <n-button type="primary" @click="showVoteModal = true">
              进行投票
            </n-button>
          </div>

          <!-- 已投票记录简要展示 -->
          <div v-if="Object.keys(candidatesData.votedUsers).length > 0" class="mt-2">
            <div class="text-sm text-gray-500 mb-1">已投票给：</div>
            <n-space>
              <template v-for="candidate in candidatesData.candidates" :key="candidate.userId">
                <n-tag
                  v-if="candidatesData.votedUsers[candidate.userId]"
                  type="success"
                  closable
                  :disabled="cancelVoteLoading"
                  @close="handleCancelVote(candidate.userId)"
                >
                  <FishpiUser
                    :name="candidate.user?.name || candidate.userId"
                    :nickname="candidate.user?.nickname"
                    mode="mini"
                    disable-link
                  />
                  ({{ candidatesData.votedUsers[candidate.userId] }}票)
                </n-tag>
              </template>
            </n-space>
            <div class="text-xs text-gray-400 mt-1">点击 × 可撤销投票</div>
          </div>
        </div>
      </template>

      <!-- 最终获胜者展示（放在最上方） -->
      <template v-if="resultData.isVoteCompleted && resultData.finalWinner">
        <n-divider />
        <n-alert type="success" title="🎉 优胜者">
          <div class="flex items-center gap-3 mt-2">
            <FishpiUser
              :name="resultData.finalWinner.name"
              :nickname="resultData.finalWinner.nickname"
              :avatar="resultData.finalWinner.avatar"
              mode="full"
              :avatar-size="56"
            />
            <span class="text-gray-500 ml-2">· 最终得票 {{ resultData.finalWinner.votes }} 票</span>
          </div>
          <!-- 获胜者的文章 -->
          <div v-if="resultData.finalWinner.articles && resultData.finalWinner.articles.length > 0" class="mt-3">
            <div class="text-sm font-medium mb-1">获奖作品：</div>
            <div v-for="article in resultData.finalWinner.articles" :key="article.id" class="text-sm">
              <a
                :href="getArticleUrl(article.oId)"
                target="_blank"
                class="text-blue-500 hover:underline"
              >
                {{ article.title }}
              </a>
              <span class="text-gray-400 ml-2">
                👀{{ article.viewCount }} 👍{{ article.goodCnt }} 💬{{ article.commentCount }}
              </span>
            </div>
          </div>
        </n-alert>
      </template>

      <!-- 投票结果（按轮次倒序展示） -->
      <template v-if="resultData.results && resultData.results.length > 0">
        <n-divider />
        <div>
          <h4 class="text-base font-medium mb-2">投票结果</h4>

          <!-- 按轮次倒序展示（最后一轮在上） -->
          <div class="space-y-4">
            <div
              v-for="round in [...resultData.results].reverse()"
              :key="round.round"
              class="border rounded-lg overflow-hidden dark:border-gray-600"
            >
              <!-- 轮次标题 -->
              <div class="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center justify-between">
                <span class="font-medium">第 {{ round.round }} 轮</span>
                <n-tag type="default" size="small">
                  {{ round.votedCount }}人投票 / {{ getAbstainCount(round) }}人弃票
                </n-tag>
              </div>

              <!-- 投票详情 -->
              <div class="p-3 space-y-2">
                <div
                  v-for="(item, index) in [...round.results].sort((a, b) => b.count - a.count)"
                  :key="item.userId"
                  class="flex items-center justify-between p-2 rounded"
                  :class="[
                    round.continue && round.userIds.includes(item.userId)
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : !round.continue && round.userIds.includes(item.userId)
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <span class="w-6 text-center font-bold">{{ index + 1 }}</span>
                    <FishpiUser
                      v-if="item.user"
                      :name="item.user.name"
                      :nickname="item.user.nickname"
                      :avatar="item.user.avatar"
                      mode="normal"
                    />
                    <span v-else>{{ item.userId }}</span>
                  </div>
                  <n-tag type="primary">{{ item.count }} 票</n-tag>
                </div>
              </div>

              <!-- 本轮结果说明 -->
              <div class="bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm border-t dark:border-gray-600">
                <template v-if="round.continue">
                  <span class="text-yellow-600 dark:text-yellow-400">
                    ⚡ {{ getNextRoundUserNames(round) }} 进入第 {{ round.round + 1 }} 轮投票
                  </span>
                </template>
                <template v-else>
                  <span class="text-green-600 dark:text-green-400">
                    🏆 最终获胜者：{{ getWinnerName(round) }}
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 无结果 -->
      <n-empty
        v-else-if="resultData.status === 'completed' && (!resultData.results || resultData.results.length === 0)"
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

    <!-- 投票弹窗 -->
    <n-modal
      v-model:show="showVoteModal"
      preset="card"
      title="评审团投票"
      style="width: 600px; max-width: 90vw;"
    >
      <template v-if="candidatesData">
        <n-alert v-if="candidatesData.remainingVotes <= 0" type="warning" class="mb-3">
          您的票数已用完
        </n-alert>
        <n-alert v-else-if="!candidatesData.allowRepeat" type="info" class="mb-3">
          每位候选人只能投一票，剩余 {{ candidatesData.remainingVotes }} 票
        </n-alert>
        <n-alert v-else type="info" class="mb-3">
          剩余 {{ candidatesData.remainingVotes }} / {{ candidatesData.totalVotes }} 票
        </n-alert>

        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="candidate in candidatesData.candidates"
            :key="candidate.userId"
            class="p-3 bg-gray-50 dark:bg-gray-800 rounded"
          >
            <div class="flex items-center justify-between mb-2">
              <FishpiUser
                v-if="candidate.user"
                :name="candidate.user.name"
                :nickname="candidate.user.nickname"
                :avatar="candidate.user.avatar"
                mode="full"
                :avatar-size="36"
              />
              <span v-else>{{ candidate.userId }}</span>
              <div class="flex items-center gap-2">
                <n-tag v-if="candidatesData.votedUsers[candidate.userId]" type="success" size="small">
                  已投 {{ candidatesData.votedUsers[candidate.userId] }} 票
                </n-tag>
                <n-button
                  type="primary"
                  size="small"
                  :disabled="!canVoteForCandidate(candidate.userId)"
                  :loading="voteLoading"
                  @click="handleVote(candidate.userId)"
                >
                  投票
                </n-button>
                <n-button
                  v-if="candidatesData.votedUsers[candidate.userId]"
                  type="error"
                  size="small"
                  :loading="cancelVoteLoading"
                  @click="handleCancelVote(candidate.userId)"
                >
                  撤销
                </n-button>
              </div>
            </div>

            <!-- 候选人的文章列表 -->
            <div v-if="candidate.articles.length > 0" class="mt-2 pl-12">
              <div class="text-sm text-gray-500 mb-1">相关文章:</div>
              <div v-for="article in candidate.articles" :key="article.id" class="text-sm">
                <a
                  :href="getArticleUrl(article.oId)"
                  target="_blank"
                  class="text-blue-500 hover:underline"
                >
                  {{ article.title }}
                </a>
                <span class="text-gray-400 ml-2">
                  👀{{ article.viewCount }} 👍{{ article.goodCnt }} 💬{{ article.commentCount }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <n-button @click="showVoteModal = false">关闭</n-button>
      </template>
    </n-modal>
  </n-card>
</template>

<style scoped>
.vote-jury-result {
  margin-bottom: 1rem;
}
</style>
