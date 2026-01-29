<script setup lang="ts">
import { voteJuryApi } from '@/api'
import type {
  GetJuryInfoResponse,
  JuryStatus,
  GetVoteDetailsResponse,
} from '@/types'
import FishpiUser from '@/components/common/FishpiUser.vue'

const route = useRoute()
const message = useMessage()
const voteId = computed(() => route.params.vote_id as string)

// 数据状态
const loading = ref(true)
const error = ref<string | null>(null)
const juryInfo = ref<GetJuryInfoResponse | null>(null)
const voteDetails = ref<GetVoteDetailsResponse | null>(null)

// 添加成员相关
const addMemberUsername = ref('')
const addMemberLoading = ref(false)
const createUserLoading = ref(false)

// 状态切换相关
const switchStatusLoading = ref(false)

// 算票相关
const calculateLoading = ref(false)

// 搜索相关
const searchMember = ref('')
const searchApply = ref('')
const searchVoteDetail = ref('')
const searchResult = ref('')

// 投票详情弹窗相关
const voteDetailModalVisible = ref(false)
const currentVoteDetailItem = ref<{ userId: string; count: number; user: { name: string; nickname: string; avatar: string } | null; voteDetails?: { fromUserId: string; fromUser: { id: string; name: string; nickname: string; avatar: string } | null; times: number }[] } | null>(null)

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

// 下一个状态映射（前进）
const nextStatusMap: Record<JuryStatus, JuryStatus | null> = {
  pending: 'applying',
  applying: 'publicity',
  publicity: 'voting',
  voting: 'completed',
  completed: null,
}

// 上一个状态映射（回退）
const prevStatusMap: Record<JuryStatus, JuryStatus | null> = {
  pending: null,
  applying: 'pending',
  publicity: 'applying',
  voting: 'publicity',
  completed: 'voting',
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
    second: '2-digit',
  })
}

// 获取评审团信息
async function fetchJuryInfo() {
  loading.value = true
  error.value = null

  try {
    juryInfo.value = await voteJuryApi.getJuryInfo(voteId.value)

    if (!juryInfo.value.isAdmin) {
      error.value = '您没有管理员权限'
      return
    }

    // 如果是评审中状态，获取投票详情
    if (juryInfo.value.rule.status === 'voting') {
      await fetchVoteDetails()
    }
  } catch (e) {
    console.error('获取评审团信息失败:', e)
    error.value = e instanceof Error ? e.message : '加载数据时发生错误'
  } finally {
    loading.value = false
  }
}

// 获取投票详情
async function fetchVoteDetails() {
  try {
    voteDetails.value = await voteJuryApi.getVoteDetails(voteId.value)
  } catch (e) {
    console.error('获取投票详情失败:', e)
  }
}

// 创建用户
async function handleCreateUser() {
  if (!addMemberUsername.value.trim()) {
    message.warning('请输入用户名')
    return
  }

  createUserLoading.value = true
  try {
    const result = await voteJuryApi.createUser({
      voteId: voteId.value,
      username: addMemberUsername.value.trim(),
    })
    message.success(result.message)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '创建用户失败')
  } finally {
    createUserLoading.value = false
  }
}

// 添加成员
async function handleAddMember() {
  if (!addMemberUsername.value.trim()) {
    message.warning('请输入用户名')
    return
  }

  addMemberLoading.value = true
  try {
    const result = await voteJuryApi.addMember({
      voteId: voteId.value,
      username: addMemberUsername.value.trim(),
    })
    message.success(result.message)
    addMemberUsername.value = ''
    // 刷新数据
    await fetchJuryInfo()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '添加成员失败')
  } finally {
    addMemberLoading.value = false
  }
}

// 审核申请
async function handleAuditApply(applyId: string, status: 'approved' | 'rejected') {
  try {
    await voteJuryApi.auditApply({
      voteId: voteId.value,
      applyId,
      status,
    })
    message.success('审核成功')
    await fetchJuryInfo()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '审核失败')
  }
}

// 切换状态
async function handleSwitchStatus() {
  if (!juryInfo.value) return

  const currentStatus = juryInfo.value.rule.status
  const nextStatus = nextStatusMap[currentStatus]

  if (!nextStatus) {
    message.warning('已是最终状态')
    return
  }

  switchStatusLoading.value = true
  try {
    await voteJuryApi.switchStatus({
      voteId: voteId.value,
      newStatus: nextStatus,
    })
    message.success('状态切换成功')
    await fetchJuryInfo()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '状态切换失败')
  } finally {
    switchStatusLoading.value = false
  }
}

// 回退状态
async function handleRevertStatus() {
  if (!juryInfo.value) return

  const currentStatus = juryInfo.value.rule.status
  const prevStatus = prevStatusMap[currentStatus]

  if (!prevStatus) {
    message.warning('已是初始状态')
    return
  }

  switchStatusLoading.value = true
  try {
    await voteJuryApi.switchStatus({
      voteId: voteId.value,
      newStatus: prevStatus,
    })
    message.success('状态回退成功')
    await fetchJuryInfo()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '状态回退失败')
  } finally {
    switchStatusLoading.value = false
  }
}

// 算票
async function handleCalculate() {
  calculateLoading.value = true
  try {
    const result = await voteJuryApi.calculate({
      voteId: voteId.value,
    })

    if (result.needNextRound) {
      message.warning(`${result.message}，进入第 ${result.nextRound} 轮投票`)
    } else {
      message.success(`${result.message}，获胜者: ${result.winner}`)
    }

    await fetchJuryInfo()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '算票失败')
  } finally {
    calculateLoading.value = false
  }
}

// 删除成员
async function handleRemoveMember(userId: string, userName: string) {
  try {
    await voteJuryApi.removeMember({
      voteId: voteId.value,
      userId,
    })
    message.success(`已删除成员: ${userName}`)
    await fetchJuryInfo()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '删除成员失败')
  }
}

// 获取申请状态标签类型
function getApplyStatusType(status: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'approved':
      return 'success'
    case 'rejected':
      return 'error'
    default:
      return 'default'
  }
}

// 获取申请状态文本
function getApplyStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return '待审核'
    case 'approved':
      return '已通过'
    case 'rejected':
      return '已拒绝'
    default:
      return status
  }
}

onMounted(() => {
  fetchJuryInfo()
})

watch(voteId, () => {
  fetchJuryInfo()
})

// 过滤后的成员列表
const filteredMembers = computed(() => {
  if (!juryInfo.value?.members) return []
  if (!searchMember.value.trim()) return juryInfo.value.members
  const keyword = searchMember.value.toLowerCase().trim()
  return juryInfo.value.members.filter(member =>
    member.name.toLowerCase().includes(keyword) ||
    member.nickname.toLowerCase().includes(keyword)
  )
})

// 过滤后的申请列表
const filteredApplyLogs = computed(() => {
  if (!juryInfo.value?.applyLogs) return []
  if (!searchApply.value.trim()) return juryInfo.value.applyLogs
  const keyword = searchApply.value.toLowerCase().trim()
  return juryInfo.value.applyLogs.filter(log =>
    log.user?.name.toLowerCase().includes(keyword) ||
    log.user?.nickname.toLowerCase().includes(keyword) ||
    log.reason?.toLowerCase().includes(keyword)
  )
})

// 过滤后的投票详情
const filteredVoteDetails = computed(() => {
  if (!voteDetails.value?.memberDetails) return []
  if (!searchVoteDetail.value.trim()) return voteDetails.value.memberDetails
  const keyword = searchVoteDetail.value.toLowerCase().trim()
  return voteDetails.value.memberDetails.filter(member =>
    member.user?.name.toLowerCase().includes(keyword) ||
    member.user?.nickname.toLowerCase().includes(keyword)
  )
})

// 过滤后的投票结果（每轮结果中的用户）
function filterRoundResults(results: { userId: string; count: number; user: { name: string; nickname: string; avatar: string } | null; voteDetails?: { fromUserId: string; fromUser: { id: string; name: string; nickname: string; avatar: string } | null; times: number }[] }[]) {
  if (!searchResult.value.trim()) return results
  const keyword = searchResult.value.toLowerCase().trim()
  return results.filter(item =>
    item.user?.name.toLowerCase().includes(keyword) ||
    item.user?.nickname.toLowerCase().includes(keyword)
  )
}

// 投票结果按轮次倒序排序
const sortedResults = computed(() => {
  if (!juryInfo.value?.results) return []
  return [...juryInfo.value.results].sort((a, b) => b.round - a.round)
})

// 显示投票详情弹窗
function showVoteDetailModal(item: { userId: string; count: number; user: { name: string; nickname: string; avatar: string } | null; voteDetails?: { fromUserId: string; fromUser: { id: string; name: string; nickname: string; avatar: string } | null; times: number }[] }) {
  currentVoteDetailItem.value = item
  voteDetailModalVisible.value = true
}
</script>

<template>
  <div class="p-4 max-w-6xl mx-auto">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <n-spin size="large" />
    </div>

    <!-- 错误状态 -->
    <n-result v-else-if="error" status="error" title="加载失败" :description="error">
      <template #footer>
        <n-button type="primary" @click="$router.push('/')">返回首页</n-button>
      </template>
    </n-result>

    <!-- 主内容 -->
    <template v-else-if="juryInfo">
      <!-- 头部信息 -->
      <n-card class="mb-4">
        <template #header>
          <div class="flex items-center justify-between">
            <span>{{ juryInfo.vote.name }} - 评审团管理</span>
            <n-tag :type="statusColorMap[juryInfo.rule.status]">
              {{ statusMap[juryInfo.rule.status] }}
            </n-tag>
          </div>
        </template>

        <n-descriptions :column="2" label-placement="left">
          <n-descriptions-item label="投票类型">
            {{ juryInfo.vote.type === 'jury' ? '评审团投票' : '普通投票' }}
          </n-descriptions-item>
          <n-descriptions-item label="每人票数">
            {{ juryInfo.vote.times }}
          </n-descriptions-item>
          <n-descriptions-item label="评审团席位">
            {{ juryInfo.members.length }} / {{ juryInfo.rule.count }}
          </n-descriptions-item>
          <n-descriptions-item label="当前轮次">
            第 {{ juryInfo.rule.currentRound || 1 }} 轮
          </n-descriptions-item>
          <n-descriptions-item label="投票开始">
            {{ formatDateTime(juryInfo.vote.start) }}
          </n-descriptions-item>
          <n-descriptions-item label="投票结束">
            {{ formatDateTime(juryInfo.vote.end) }}
          </n-descriptions-item>
          <n-descriptions-item label="申请时间">
            {{ formatDateTime(juryInfo.rule.applyTime) }}
          </n-descriptions-item>
          <n-descriptions-item label="公示时间">
            {{ formatDateTime(juryInfo.rule.publicityTime) }}
          </n-descriptions-item>
        </n-descriptions>

        <!-- 状态切换和算票按钮 -->
        <n-space class="mt-4">
          <n-button
            v-if="nextStatusMap[juryInfo.rule.status] && !juryInfo.isVoteCompleted"
            type="primary"
            :loading="switchStatusLoading"
            @click="handleSwitchStatus"
          >
            切换到: {{ statusMap[nextStatusMap[juryInfo.rule.status]!] }}
          </n-button>

          <n-button
            v-if="prevStatusMap[juryInfo.rule.status]"
            type="default"
            :loading="switchStatusLoading"
            @click="handleRevertStatus"
          >
            回退到: {{ statusMap[prevStatusMap[juryInfo.rule.status]!] }}
          </n-button>

          <n-button
            v-if="juryInfo.rule.status === 'voting' && !juryInfo.isVoteCompleted"
            type="warning"
            :loading="calculateLoading"
            @click="handleCalculate"
          >
            手动算票
          </n-button>
        </n-space>

        <!-- 最终获胜者展示 -->
        <template v-if="juryInfo.isVoteCompleted && juryInfo.finalWinner">
          <n-divider />
          <n-alert type="success" title="投票已结束">
            <div class="flex items-center gap-3 mt-2">
              <FishpiUser
                :name="juryInfo.finalWinner.name"
                :nickname="juryInfo.finalWinner.nickname"
                :avatar="juryInfo.finalWinner.avatar"
                mode="full"
                :avatar-size="48"
              />
              <span class="text-gray-500 ml-2">· {{ juryInfo.finalWinner.votes }} 票</span>
            </div>
          </n-alert>
        </template>

        <!-- 投票进度 -->
        <template v-if="juryInfo.votingProgress">
          <n-divider />
          <n-descriptions :column="3" label-placement="left">
            <n-descriptions-item label="已投票">
              {{ juryInfo.votingProgress.voted }}
            </n-descriptions-item>
            <n-descriptions-item label="未投票">
              {{ juryInfo.votingProgress.unvoted }}
            </n-descriptions-item>
            <n-descriptions-item label="总人数">
              {{ juryInfo.votingProgress.total }}
            </n-descriptions-item>
          </n-descriptions>
        </template>
      </n-card>

      <!-- 投票详情（评审中状态） -->
      <n-card v-if="juryInfo.rule.status === 'voting' && voteDetails" class="mb-4" title="投票详情">
        <template #header-extra>
          <n-space>
            <n-input
              v-model:value="searchVoteDetail"
              placeholder="搜索成员..."
              clearable
              size="small"
              style="width: 150px"
            >
              <template #prefix>
                <n-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></n-icon>
              </template>
            </n-input>
            <n-tag type="info">第 {{ voteDetails.currentRound }} 轮</n-tag>
          </n-space>
        </template>
        <n-collapse>
          <n-collapse-item
            v-for="member in filteredVoteDetails"
            :key="member.userId"
            :name="member.userId"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <FishpiUser
                  v-if="member.user"
                  :name="member.user.name"
                  :nickname="member.user.nickname"
                  :avatar="member.user.avatar"
                  mode="normal"
                />
                <span v-else>{{ member.userId }}</span>
                <n-tag v-if="member.hasVoted" type="success" size="small">已投票 ({{ member.voteCount }})</n-tag>
                <n-tag v-else type="warning" size="small">未投票</n-tag>
              </div>
            </template>

            <template v-if="member.votes.length > 0">
              <n-table :bordered="false" :single-line="false" size="small">
                <thead>
                  <tr>
                    <th>投给</th>
                    <th>票数</th>
                    <th>备注</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(vote, idx) in member.votes" :key="idx">
                    <td>
                      <FishpiUser
                        v-if="vote.toUser"
                        :name="vote.toUser.name"
                        :nickname="vote.toUser.nickname"
                        :avatar="vote.toUser.avatar"
                        mode="normal"
                        :avatar-size="24"
                      />
                      <span v-else>{{ vote.toUserId }}</span>
                    </td>
                    <td>{{ vote.times }}</td>
                    <td>{{ vote.comment || '-' }}</td>
                    <td>{{ formatDateTime(vote.created) }}</td>
                  </tr>
                </tbody>
              </n-table>
            </template>
            <n-empty v-else description="暂无投票记录" size="small" />
          </n-collapse-item>
        </n-collapse>
      </n-card>

      <!-- 投票结果（移动到评审团成员上方） -->
      <n-card v-if="juryInfo.results && juryInfo.results.length > 0" class="mb-4" title="投票结果">
        <template #header-extra>
          <n-input
            v-model:value="searchResult"
            placeholder="搜索用户..."
            clearable
            size="small"
            style="width: 150px"
          >
            <template #prefix>
              <n-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></n-icon>
            </template>
          </n-input>
        </template>
        <n-collapse>
          <n-collapse-item
            v-for="round in sortedResults"
            :key="round.round"
            :title="`第 ${round.round} 轮`"
            :name="round.round"
          >
            <template #header-extra>
              <n-space>
                <n-tag v-if="round.abstainCount" type="default" size="small">
                  {{ round.abstainCount }} 人弃票
                </n-tag>
                <n-tag v-if="round.continue" type="warning">进入下一轮</n-tag>
                <n-tag v-else type="success">已完成</n-tag>
              </n-space>
            </template>

            <n-table :bordered="false" :single-line="false">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>用户</th>
                  <th>得票数</th>
                  <th>投票详情</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in filterRoundResults([...round.results].sort((a, b) => b.count - a.count))"
                  :key="item.userId"
                >
                  <td>{{ index + 1 }}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <FishpiUser
                        v-if="item.user"
                        :name="item.user.name"
                        :nickname="item.user.nickname"
                        :avatar="item.user.avatar"
                        mode="normal"
                        :avatar-size="24"
                      />
                      <span v-else>{{ item.userId }}</span>
                      <n-tag
                        v-if="round.continue && round.userIds.includes(item.userId)"
                        type="info"
                        size="small"
                      >
                        进入下一轮
                      </n-tag>
                    </div>
                  </td>
                  <td>{{ item.count }}</td>
                  <td>
                    <div v-if="item.voteDetails && item.voteDetails.length > 0" class="flex items-center gap-1 cursor-pointer" @click="showVoteDetailModal(item)">
                      <!-- 头像列表，最多显示5个 -->
                      <div class="flex -space-x-2">
                        <n-avatar
                          v-for="(detail, idx) in item.voteDetails.slice(0, 5)"
                          :key="idx"
                          :src="detail.fromUser?.avatar"
                          :size="24"
                          round
                          class="border-2 border-white dark:border-gray-800"
                        />
                        <n-avatar
                          v-if="item.voteDetails.length > 5"
                          :size="24"
                          round
                          class="border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 text-xs"
                        >
                          +{{ item.voteDetails.length - 5 }}
                        </n-avatar>
                      </div>
                      <span class="text-xs text-gray-500 ml-1">{{ item.voteDetails.length }}人</span>
                    </div>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                </tr>
                <tr v-if="filterRoundResults([...round.results]).length === 0">
                  <td colspan="4" class="text-center text-gray-500">
                    未找到匹配的用户
                  </td>
                </tr>
              </tbody>
            </n-table>

            <!-- 弃票用户展示 -->
            <div v-if="round.abstainUsers && round.abstainUsers.length > 0" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm text-gray-500">弃票用户 ({{ round.abstainUsers.length }}人):</span>
              </div>
              <n-space>
                <FishpiUser
                  v-for="user in round.abstainUsers"
                  :key="user.id"
                  :name="user.name"
                  :nickname="user.nickname"
                  :avatar="user.avatar"
                  mode="simple"
                  :avatar-size="28"
                />
              </n-space>
            </div>
          </n-collapse-item>
        </n-collapse>
      </n-card>

      <!-- 评审团成员管理 -->
      <n-card class="mb-4" title="评审团成员">
        <template #header-extra>
          <n-input
            v-model:value="searchMember"
            placeholder="搜索成员..."
            clearable
            size="small"
            style="width: 150px"
          >
            <template #prefix>
              <n-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></n-icon>
            </template>
          </n-input>
        </template>
        <!-- 添加成员 -->
        <n-space class="mb-4">
          <n-input
            v-model:value="addMemberUsername"
            placeholder="输入鱼派用户名"
            style="width: 200px"
          />
          <n-button
            :loading="createUserLoading"
            @click="handleCreateUser"
          >
            创建用户
          </n-button>
          <n-button
            type="primary"
            :loading="addMemberLoading"
            @click="handleAddMember"
          >
            添加成员
          </n-button>
        </n-space>

        <!-- 成员列表 -->
        <n-table :bordered="false" :single-line="false">
          <thead>
            <tr>
              <th>用户</th>
              <th>是否决策者</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in filteredMembers" :key="member.id">
              <td>
                <FishpiUser
                  :name="member.name"
                  :nickname="member.nickname"
                  :avatar="member.avatar"
                  mode="full"
                  :avatar-size="32"
                />
              </td>
              <td>
                <n-tag v-if="juryInfo.rule.decisions.includes(member.id)" type="warning">
                  决策者
                </n-tag>
                <span v-else>-</span>
              </td>
              <td>
                <n-popconfirm @positive-click="handleRemoveMember(member.id, member.name)">
                  <template #trigger>
                    <n-button type="error" size="small">删除</n-button>
                  </template>
                  确定要删除该成员吗？
                </n-popconfirm>
              </td>
            </tr>
            <tr v-if="filteredMembers.length === 0">
              <td colspan="3" class="text-center text-gray-500">
                {{ searchMember ? '未找到匹配的成员' : '暂无成员' }}
              </td>
            </tr>
          </tbody>
        </n-table>
      </n-card>

      <!-- 申请审核 -->
      <n-card v-if="juryInfo.applyLogs && juryInfo.applyLogs.length > 0" class="mb-4" title="申请审核">
        <template #header-extra>
          <n-input
            v-model:value="searchApply"
            placeholder="搜索申请..."
            clearable
            size="small"
            style="width: 150px"
          >
            <template #prefix>
              <n-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></n-icon>
            </template>
          </n-input>
        </template>
        <n-table :bordered="false" :single-line="false">
          <thead>
            <tr>
              <th>申请人</th>
              <th>申请理由</th>
              <th>状态</th>
              <th>申请时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredApplyLogs" :key="log.id">
              <td>
                <FishpiUser
                  v-if="log.user"
                  :name="log.user.name"
                  :nickname="log.user.nickname"
                  :avatar="log.user.avatar"
                  mode="normal"
                  :avatar-size="24"
                />
                <span v-else>{{ log.userId }}</span>
              </td>
              <td>{{ log.reason || '-' }}</td>
              <td>
                <n-tag :type="getApplyStatusType(log.status)">
                  {{ getApplyStatusText(log.status) }}
                </n-tag>
              </td>
              <td>{{ formatDateTime(log.created) }}</td>
              <td>
                <n-space v-if="log.status === 'pending'">
                  <n-button
                    type="success"
                    size="small"
                    @click="handleAuditApply(log.id, 'approved')"
                  >
                    通过
                  </n-button>
                  <n-button
                    type="error"
                    size="small"
                    @click="handleAuditApply(log.id, 'rejected')"
                  >
                    拒绝
                  </n-button>
                </n-space>
                <span v-else>-</span>
              </td>
            </tr>
            <tr v-if="filteredApplyLogs.length === 0">
              <td colspan="5" class="text-center text-gray-500">
                {{ searchApply ? '未找到匹配的申请' : '暂无申请' }}
              </td>
            </tr>
          </tbody>
        </n-table>
      </n-card>

    </template>

    <!-- 投票详情弹窗 -->
    <n-modal
      v-model:show="voteDetailModalVisible"
      preset="card"
      title="投票详情"
      style="width: 500px; max-width: 90vw;"
      :trap-focus="false"
      :auto-focus="false"
    >
      <template v-if="currentVoteDetailItem">
        <div class="mb-3 flex items-center flex-wrap gap-2">
          <span class="text-gray-500">被投票人：</span>
          <FishpiUser
            v-if="currentVoteDetailItem.user"
            :name="currentVoteDetailItem.user.name"
            :nickname="currentVoteDetailItem.user.nickname"
            :avatar="currentVoteDetailItem.user.avatar"
            mode="normal"
            :avatar-size="24"
          />
          <span v-else>{{ currentVoteDetailItem.userId }}</span>
          <n-tag type="success" size="small">{{ currentVoteDetailItem.count }} 票</n-tag>
        </div>
        <n-divider />
        <div class="vote-detail-list max-h-96 overflow-y-auto">
          <div
            v-for="(detail, idx) in currentVoteDetailItem.voteDetails"
            :key="idx"
            class="vote-detail-item flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
          >
            <FishpiUser
              v-if="detail.fromUser"
              :name="detail.fromUser.name"
              :nickname="detail.fromUser.nickname"
              :avatar="detail.fromUser.avatar"
              mode="normal"
              :avatar-size="28"
            />
            <span v-else>{{ detail.fromUserId }}</span>
            <n-tag v-if="detail.times > 1" type="info" size="small">
              {{ detail.times }} 票
            </n-tag>
            <n-tag v-else type="default" size="small">1 票</n-tag>
          </div>
        </div>
        <div v-if="!currentVoteDetailItem.voteDetails || currentVoteDetailItem.voteDetails.length === 0" class="text-center text-gray-400 py-4">
          暂无投票详情
        </div>
      </template>
    </n-modal>
  </div>
</template>
