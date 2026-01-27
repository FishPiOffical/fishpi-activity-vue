<script setup lang="ts">
import { voteJuryApi } from '@/api'
import type {
  GetJuryInfoResponse,
  JuryStatus,
  GetVoteDetailsResponse,
} from '@/types'

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
            v-if="nextStatusMap[juryInfo.rule.status]"
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
            v-if="juryInfo.rule.status === 'voting'"
            type="warning"
            :loading="calculateLoading"
            @click="handleCalculate"
          >
            手动算票
          </n-button>
        </n-space>

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
          <n-tag type="info">第 {{ voteDetails.currentRound }} 轮</n-tag>
        </template>
        <n-collapse>
          <n-collapse-item
            v-for="member in voteDetails.memberDetails"
            :key="member.userId"
            :name="member.userId"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <n-avatar v-if="member.user" :src="member.user.avatar" :size="28" round />
                <span>{{ member.user?.nickname || member.userId }}</span>
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
                      <div class="flex items-center gap-2">
                        <n-avatar v-if="vote.toUser" :src="vote.toUser.avatar" :size="24" round />
                        <span>{{ vote.toUser?.nickname || vote.toUserId }}</span>
                      </div>
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

      <!-- 评审团成员管理 -->
      <n-card class="mb-4" title="评审团成员">
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
              <th>头像</th>
              <th>用户名</th>
              <th>昵称</th>
              <th>是否决策者</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in juryInfo.members" :key="member.id">
              <td>
                <n-avatar :src="member.avatar" :size="32" round />
              </td>
              <td>{{ member.name }}</td>
              <td>{{ member.nickname }}</td>
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
            <tr v-if="juryInfo.members.length === 0">
              <td colspan="5" class="text-center text-gray-500">
                暂无成员
              </td>
            </tr>
          </tbody>
        </n-table>
      </n-card>

      <!-- 申请审核 -->
      <n-card v-if="juryInfo.applyLogs && juryInfo.applyLogs.length > 0" class="mb-4" title="申请审核">
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
            <tr v-for="log in juryInfo.applyLogs" :key="log.id">
              <td>
                <div class="flex items-center gap-2">
                  <n-avatar v-if="log.user" :src="log.user.avatar" :size="24" round />
                  <span>{{ log.user?.name || log.userId }}</span>
                </div>
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
          </tbody>
        </n-table>
      </n-card>

      <!-- 投票结果 -->
      <n-card v-if="juryInfo.results && juryInfo.results.length > 0" title="投票结果">
        <n-collapse>
          <n-collapse-item
            v-for="round in juryInfo.results"
            :key="round.round"
            :title="`第 ${round.round} 轮`"
            :name="round.round"
          >
            <template #header-extra>
              <n-tag v-if="round.continue" type="warning">进入下一轮</n-tag>
              <n-tag v-else type="success">已完成</n-tag>
            </template>

            <n-table :bordered="false" :single-line="false">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>用户</th>
                  <th>得票数</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in [...round.results].sort((a, b) => b.count - a.count)"
                  :key="item.userId"
                >
                  <td>{{ index + 1 }}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <n-avatar v-if="item.user" :src="item.user.avatar" :size="24" round />
                      <span>{{ item.user?.name || item.userId }}</span>
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
                </tr>
              </tbody>
            </n-table>
          </n-collapse-item>
        </n-collapse>
      </n-card>
    </template>
  </div>
</template>
