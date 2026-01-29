<script setup lang="ts">
/**
 * 用户选择组件
 * 支持搜索用户、从活动参与者、评审团成员中选择
 */
import { NButton, NSpace, NTag, NAvatar } from 'naive-ui'
import medalApi from '@/api/medal'

interface UserItem {
  id: string
  oId: string
  name: string
  nickname: string
  avatar: string
}

interface ActivityItem {
  id: string
  name: string
  slug: string
  voteId: string
}

const props = defineProps<{
  selectedUsers: UserItem[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedUsers', users: UserItem[]): void
}>()

const message = useMessage()

// 搜索用户
const searchKeyword = ref('')
const searchLoading = ref(false)
const searchResults = ref<UserItem[]>([])

async function searchUsers() {
  if (!searchKeyword.value.trim()) {
    message.warning('请输入搜索关键词')
    return
  }
  searchLoading.value = true
  try {
    const result = await medalApi.searchUsers(searchKeyword.value.trim())
    searchResults.value = result.items || []
    if (searchResults.value.length === 0) {
      message.info('未找到匹配的用户')
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
  } finally {
    searchLoading.value = false
  }
}

// 活动列表
const activities = ref<ActivityItem[]>([])
const activitiesLoading = ref(false)

// 活动参与者 - 使用独立的选中状态
const selectedActivityIdForParticipants = ref<string | null>(null)
const activityParticipants = ref<UserItem[]>([])
const participantsLoading = ref(false)

// 评审团成员 - 使用独立的选中状态
const selectedActivityIdForJury = ref<string | null>(null)
const juryMembers = ref<UserItem[]>([])
const juryLoading = ref(false)

async function loadActivities() {
  if (activities.value.length > 0) return
  activitiesLoading.value = true
  try {
    const result = await medalApi.getActivities()
    activities.value = result.items || []
  } catch (error) {
    console.error('加载活动列表失败:', error)
  } finally {
    activitiesLoading.value = false
  }
}

async function loadActivityParticipants(activityId: string) {
  selectedActivityIdForParticipants.value = activityId
  participantsLoading.value = true
  activityParticipants.value = []
  try {
    const result = await medalApi.getActivityParticipants(activityId)
    activityParticipants.value = result.items || []
    if (activityParticipants.value.length === 0) {
      message.info('该活动暂无参与者')
    }
  } catch (error) {
    console.error('加载活动参与者失败:', error)
  } finally {
    participantsLoading.value = false
  }
}

async function loadJuryMembers(activityId: string) {
  selectedActivityIdForJury.value = activityId
  const voteId = getActivityVoteId(activityId)
  if (!voteId) {
    message.warning('该活动没有关联的投票')
    return
  }
  juryLoading.value = true
  juryMembers.value = []
  try {
    const result = await medalApi.getVoteJuryMembers(voteId)
    juryMembers.value = result.items || []
    if (juryMembers.value.length === 0) {
      message.info('该投票暂无评审团成员')
    }
  } catch (error) {
    console.error('加载评审团成员失败:', error)
  } finally {
    juryLoading.value = false
  }
}

// 添加用户
function addUser(user: UserItem) {
  if (props.selectedUsers.some((u) => u.oId === user.oId)) {
    message.warning('该用户已在列表中')
    return
  }
  emit('update:selectedUsers', [...props.selectedUsers, user])
}

// 批量添加用户
function addUsers(users: UserItem[]) {
  const newUsers = users.filter((u) => !props.selectedUsers.some((su) => su.oId === u.oId))
  if (newUsers.length === 0) {
    message.warning('所有用户都已在列表中')
    return
  }
  emit('update:selectedUsers', [...props.selectedUsers, ...newUsers])
  message.success(`已添加 ${newUsers.length} 个用户`)
}

// 移除用户
function removeUser(user: UserItem) {
  emit(
    'update:selectedUsers',
    props.selectedUsers.filter((u) => u.oId !== user.oId)
  )
}

// 清空用户
function clearUsers() {
  emit('update:selectedUsers', [])
}

// 当前选择模式
const currentMode = ref<'search' | 'activity' | 'jury'>('search')

// 获取活动的投票ID
function getActivityVoteId(activityId: string): string {
  const activity = activities.value.find((a) => a.id === activityId)
  return activity?.voteId || ''
}
</script>

<template>
  <div class="user-selector">
    <!-- 已选用户列表 -->
    <n-card v-if="selectedUsers.length > 0" size="small" title="已选用户" class="mb-4">
      <template #header-extra>
        <n-button size="small" type="error" quaternary @click="clearUsers">清空</n-button>
      </template>
      <n-space>
        <n-tag
          v-for="user in selectedUsers"
          :key="user.oId"
          closable
          @close="removeUser(user)"
        >
          <template #avatar>
            <n-avatar :src="user.avatar" :size="20" round />
          </template>
          {{ user.nickname || user.name }}
        </n-tag>
      </n-space>
    </n-card>

    <!-- 选择模式切换 -->
    <n-tabs v-model:value="currentMode" type="segment" class="mb-4">
      <n-tab-pane name="search" tab="搜索用户">
        <n-space vertical>
          <n-input-group>
            <n-input
              v-model:value="searchKeyword"
              placeholder="输入用户名、昵称或用户ID"
              @keyup.enter="searchUsers"
            />
            <n-button type="primary" :loading="searchLoading" @click="searchUsers">
              搜索
            </n-button>
          </n-input-group>

          <n-spin :show="searchLoading">
            <n-list v-if="searchResults.length > 0" bordered>
              <n-list-item v-for="user in searchResults" :key="user.oId">
                <template #prefix>
                  <n-avatar :src="user.avatar" round />
                </template>
                <n-thing :title="user.nickname || user.name" :description="user.name" />
                <template #suffix>
                  <n-button
                    size="small"
                    type="primary"
                    :disabled="selectedUsers.some((u) => u.oId === user.oId)"
                    @click="addUser(user)"
                  >
                    {{ selectedUsers.some((u) => u.oId === user.oId) ? '已添加' : '添加' }}
                  </n-button>
                </template>
              </n-list-item>
            </n-list>
            <n-empty v-else-if="searchKeyword && !searchLoading" description="暂无搜索结果" />
          </n-spin>
        </n-space>
      </n-tab-pane>

      <n-tab-pane name="activity" tab="活动参与者" @enter="loadActivities">
        <n-space vertical>
          <n-select
            v-model:value="selectedActivityIdForParticipants"
            :options="activities.map((a) => ({ label: a.name, value: a.id }))"
            placeholder="选择活动"
            :loading="activitiesLoading"
            filterable
            @focus="loadActivities"
            @update:value="loadActivityParticipants"
          />

          <n-spin :show="participantsLoading">
            <template v-if="activityParticipants.length > 0">
              <n-space class="mb-2">
                <n-button type="primary" size="small" @click="addUsers(activityParticipants)">
                  添加全部 ({{ activityParticipants.length }})
                </n-button>
              </n-space>
              <n-list bordered>
                <n-list-item v-for="user in activityParticipants" :key="user.oId">
                  <template #prefix>
                    <n-avatar :src="user.avatar" round />
                  </template>
                  <n-thing :title="user.nickname || user.name" :description="user.name" />
                  <template #suffix>
                    <n-button
                      size="small"
                      type="primary"
                      :disabled="selectedUsers.some((u) => u.oId === user.oId)"
                      @click="addUser(user)"
                    >
                      {{ selectedUsers.some((u) => u.oId === user.oId) ? '已添加' : '添加' }}
                    </n-button>
                  </template>
                </n-list-item>
              </n-list>
            </template>
            <n-empty v-else-if="selectedActivityIdForParticipants && !participantsLoading" description="该活动暂无参与者" />
          </n-spin>
        </n-space>
      </n-tab-pane>

      <n-tab-pane name="jury" tab="评审团成员">
        <n-space vertical>
          <n-select
            v-model:value="selectedActivityIdForJury"
            :options="activities.filter((a) => a.voteId).map((a) => ({ label: a.name, value: a.id }))"
            placeholder="选择活动（需有评审团投票）"
            :loading="activitiesLoading"
            filterable
            @focus="loadActivities"
            @update:value="loadJuryMembers"
          />

          <n-spin :show="juryLoading">
            <template v-if="juryMembers.length > 0">
              <n-space class="mb-2">
                <n-button type="primary" size="small" @click="addUsers(juryMembers)">
                  添加全部 ({{ juryMembers.length }})
                </n-button>
              </n-space>
              <n-list bordered>
                <n-list-item v-for="user in juryMembers" :key="user.oId">
                  <template #prefix>
                    <n-avatar :src="user.avatar" round />
                  </template>
                  <n-thing :title="user.nickname || user.name" :description="user.name" />
                  <template #suffix>
                    <n-button
                      size="small"
                      type="primary"
                      :disabled="selectedUsers.some((u) => u.oId === user.oId)"
                      @click="addUser(user)"
                    >
                      {{ selectedUsers.some((u) => u.oId === user.oId) ? '已添加' : '添加' }}
                    </n-button>
                  </template>
                </n-list-item>
              </n-list>
            </template>
            <n-empty v-else-if="selectedActivityIdForJury && !juryLoading" description="该投票暂无评审团成员" />
          </n-spin>
        </n-space>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.user-selector {
  width: 100%;
}
.mb-2 {
  margin-bottom: 8px;
}
.mb-4 {
  margin-bottom: 16px;
}
</style>
