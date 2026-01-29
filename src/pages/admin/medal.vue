<script setup lang="ts">
import medalApi from '@/api/medal'
import type { Medal, MedalOwner } from '@/types'
import {
  MEDAL_TYPE_OPTIONS,
  MEDAL_TYPE_COLORS,
  parseMedalAttr,
  buildMedalAttr,
} from '@/types'
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { NButton, NSpace, NTag } from 'naive-ui'
import { useUserStore } from '@/stores'
import UserSelector from '@/components/UserSelector.vue'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()

// 权限检查 - 使用 role 判断是否是管理员
const isAdmin = computed(() => userStore.isAdmin)

// 如果不是管理员，跳转到首页
onMounted(() => {
  if (!isAdmin.value) {
    message.error('无权访问此页面')
    router.push('/')
  }
})

// 勋章列表
const loading = ref(false)
const medals = ref<Medal[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  pageCount: 0,
})

// 加载勋章列表
async function loadMedals() {
  loading.value = true
  try {
    const result = await medalApi.getMedalList(pagination.page, pagination.pageSize)
    medals.value = result.items || []
    pagination.itemCount = result.total
    pagination.pageCount = result.totalPages
  } catch (error) {
    console.error('加载勋章列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理分页变化
function handlePageChange(_page: number) {
  loadMedals()
}

function handlePageSizeChange(_pageSize: number) {
  pagination.page = 1
  loadMedals()
}

// 表格列定义
const columns: DataTableColumns<Medal> = [
  {
    title: 'ID',
    key: 'medalId',
    width: 120,
  },
  {
    title: '名称',
    key: 'name',
    width: 150,
    render(row) {
      const color = MEDAL_TYPE_COLORS[row.type] || '#333'
      return h('span', { style: { color, fontWeight: 'bold' } }, row.name)
    },
  },
  {
    title: '类型',
    key: 'type',
    width: 80,
    render(row) {
      const color = MEDAL_TYPE_COLORS[row.type] || '#333'
      return h(NTag, { bordered: false, style: { color } }, () => row.type)
    },
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '预览',
    key: 'attr',
    width: 120,
    render(row) {
      const attr = parseMedalAttr(row.attr)
      if (attr.url) {
        return h('img', {
          src: attr.url,
          style: { height: '32px', borderRadius: '4px' },
        })
      }
      return '-'
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    render(row) {
      return h(NSpace, null, () => [
        h(
          NButton,
          {
            size: 'small',
            onClick: () => showDetail(row),
          },
          () => '详情'
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'info',
            onClick: () => showEditModal(row),
          },
          () => '编辑'
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'warning',
            onClick: () => showOwners(row),
          },
          () => '拥有者'
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            onClick: () => confirmDelete(row),
          },
          () => '删除'
        ),
      ])
    },
  },
]

// ==================== 勋章详情 ====================
const detailModalVisible = ref(false)
const currentMedal = ref<Medal | null>(null)

function showDetail(medal: Medal) {
  currentMedal.value = medal
  detailModalVisible.value = true
}

// ==================== 创建/编辑勋章 ====================
const editModalVisible = ref(false)
const editFormRef = ref<FormInst | null>(null)
const isEditing = ref(false)
const editingMedalId = ref('')
const editForm = reactive({
  name: '',
  type: '普通',
  description: '',
  url: '',
  backcolor: '',
  fontcolor: '',
})

const editFormRules: FormRules = {
  name: { required: true, message: '请输入勋章名称', trigger: 'blur' },
  type: { required: true, message: '请选择勋章类型', trigger: 'change' },
}

function showCreateModal() {
  isEditing.value = false
  editingMedalId.value = ''
  editForm.name = ''
  editForm.type = '普通'
  editForm.description = ''
  editForm.url = ''
  editForm.backcolor = ''
  editForm.fontcolor = ''
  editModalVisible.value = true
}

function showEditModal(medal: Medal) {
  isEditing.value = true
  editingMedalId.value = medal.medalId
  editForm.name = medal.name
  editForm.type = medal.type
  editForm.description = medal.description
  const attr = parseMedalAttr(medal.attr)
  editForm.url = attr.url || ''
  editForm.backcolor = attr.backcolor || ''
  editForm.fontcolor = attr.fontcolor || ''
  editModalVisible.value = true
}

const editSubmitting = ref(false)

async function handleEditSubmit() {
  try {
    await editFormRef.value?.validate()
  } catch {
    return
  }

  editSubmitting.value = true
  try {
    const data = {
      name: editForm.name,
      type: editForm.type,
      description: editForm.description,
      attr: buildMedalAttr({
        url: editForm.url,
        backcolor: editForm.backcolor,
        fontcolor: editForm.fontcolor,
      }),
    }

    if (isEditing.value) {
      await medalApi.editMedal(editingMedalId.value, data)
      message.success('编辑勋章成功')
    } else {
      await medalApi.createMedal(data)
      message.success('创建勋章成功')
    }

    editModalVisible.value = false
    loadMedals()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    editSubmitting.value = false
  }
}

// ==================== 删除勋章 ====================
function confirmDelete(medal: Medal) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除勋章「${medal.name}」吗？此操作不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await medalApi.deleteMedal(medal.medalId)
        message.success('删除成功')
        loadMedals()
      } catch (error) {
        console.error('删除失败:', error)
      }
    },
  })
}

// ==================== 勋章拥有者 ====================
const ownersModalVisible = ref(false)
const ownersLoading = ref(false)
const ownersMedal = ref<Medal | null>(null)
const owners = ref<MedalOwner[]>([])
const ownersPagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  pageCount: 0,
})

async function showOwners(medal: Medal) {
  ownersMedal.value = medal
  ownersPagination.page = 1
  ownersModalVisible.value = true
  await loadOwners()
}

async function loadOwners() {
  if (!ownersMedal.value) return
  ownersLoading.value = true
  try {
    const result = await medalApi.getMedalOwners(
      ownersMedal.value.medalId,
      ownersPagination.page,
      ownersPagination.pageSize
    )
    owners.value = result.items || []
    ownersPagination.itemCount = result.total
    ownersPagination.pageCount = result.totalPages
  } catch (error) {
    console.error('加载拥有者列表失败:', error)
  } finally {
    ownersLoading.value = false
  }
}

function handleOwnersPageChange(_page: number) {
  loadOwners()
}

const ownersColumns: DataTableColumns<MedalOwner> = [
  {
    title: '用户',
    key: 'userId',
    width: 200,
    render(row) {
      const user = row.expand?.userId
      if (!user) {
        return h('span', { class: 'text-gray-500' }, row.userId)
      }
      return h('a', {
        href: `https://fishpi.cn/member/${user.name}`,
        target: '_blank',
        class: 'flex items-center gap-2 hover:text-blue-600'
      }, [
        h('img', {
          src: user.avatar,
          alt: '头像',
          class: 'h-8 w-8 rounded-full object-cover'
        }),
        h('span', user.nickname || user.name)
      ])
    },
  },
  {
    title: '是否展示',
    key: 'display',
    width: 100,
    render(row) {
      return row.display ? '是' : '否'
    },
  },
  { title: '展示顺序', key: 'displayOrder', width: 100 },
  {
    title: '过期时间',
    key: 'expired',
    width: 180,
    render(row) {
      return row.expired || '永不过期'
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          type: 'error',
          onClick: () => confirmRevokeOwner(row),
        },
        () => '撤销'
      )
    },
  },
]

function confirmRevokeOwner(owner: MedalOwner) {
  const user = owner.expand?.userId
  const userName = user ? (user.nickname || user.name) : owner.userId
  dialog.warning({
    title: '确认撤销',
    content: `确定要撤销用户「${userName}」的此勋章吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await medalApi.revokeMedal({
          userId: owner.userId,
          medalId: owner.medalId,
        })
        message.success('撤销成功')
        loadOwners()
      } catch (error) {
        console.error('撤销失败:', error)
      }
    },
  })
}

// ==================== 同步功能 ====================
const syncLoading = ref(false)
const syncType = ref('')

async function syncAllMedals() {
  syncLoading.value = true
  syncType.value = 'all-medals'
  try {
    const result = await medalApi.syncAllMedals()
    message.success(
      `同步完成：共 ${result.synced_count} 个，创建 ${result.created_count}，更新 ${result.updated_count}，删除 ${result.deleted_count}`
    )
    loadMedals()
  } catch (error) {
    console.error('同步失败:', error)
  } finally {
    syncLoading.value = false
    syncType.value = ''
  }
}

// 同步指定勋章
const syncSingleModalVisible = ref(false)
const syncSingleMedalId = ref('')

function showSyncSingleModal() {
  syncSingleMedalId.value = ''
  syncSingleModalVisible.value = true
}

async function handleSyncSingle() {
  if (!syncSingleMedalId.value.trim()) {
    message.warning('请输入勋章ID')
    return
  }
  syncLoading.value = true
  syncType.value = 'single-medal'
  try {
    const result = await medalApi.syncSingleMedal(syncSingleMedalId.value.trim())
    message.success(result.created ? '勋章已创建' : '勋章已更新')
    syncSingleModalVisible.value = false
    loadMedals()
  } catch (error) {
    console.error('同步失败:', error)
  } finally {
    syncLoading.value = false
    syncType.value = ''
  }
}

async function syncAllOwners() {
  syncLoading.value = true
  syncType.value = 'all-owners'
  try {
    const result = await medalApi.syncAllMedalOwners()
    message.success(
      `同步完成：共 ${result.synced_count} 个勋章，跳过 ${result.skipped_count}，创建 ${result.total_created}，更新 ${result.total_updated}，删除 ${result.total_deleted}`
    )
  } catch (error) {
    console.error('同步失败:', error)
  } finally {
    syncLoading.value = false
    syncType.value = ''
  }
}

// 同步指定勋章的拥有者
const syncOwnersModalVisible = ref(false)
const syncOwnersMedalId = ref('')

function showSyncOwnersModal() {
  syncOwnersMedalId.value = ''
  syncOwnersModalVisible.value = true
}

async function handleSyncOwners() {
  if (!syncOwnersMedalId.value.trim()) {
    message.warning('请输入勋章ID')
    return
  }
  syncLoading.value = true
  syncType.value = 'single-owners'
  try {
    const result = await medalApi.syncSingleMedalOwners(syncOwnersMedalId.value.trim())
    message.success(`同步完成：创建 ${result.created}，更新 ${result.updated}，删除 ${result.deleted}`)
    syncOwnersModalVisible.value = false
  } catch (error) {
    console.error('同步失败:', error)
  } finally {
    syncLoading.value = false
    syncType.value = ''
  }
}

// 同步用户勋章
const syncUserModalVisible = ref(false)
const syncUserId = ref('')

function showSyncUserModal() {
  syncUserId.value = ''
  syncUserModalVisible.value = true
}

async function handleSyncUser() {
  if (!syncUserId.value.trim()) {
    message.warning('请输入用户ID')
    return
  }
  syncLoading.value = true
  syncType.value = 'user-medals'
  try {
    const result = await medalApi.syncUserMedals(syncUserId.value.trim())
    message.success(
      `同步完成：共 ${result.total_medals} 个勋章，创建 ${result.created}，更新 ${result.updated}，删除 ${result.deleted}`
    )
    syncUserModalVisible.value = false
  } catch (error) {
    console.error('同步失败:', error)
  } finally {
    syncLoading.value = false
    syncType.value = ''
  }
}

// ==================== 授予勋章 ====================
const grantModalVisible = ref(false)

interface SelectedUser {
  id: string
  oId: string
  name: string
  nickname: string
  avatar: string
}

const grantSelectedUsers = ref<SelectedUser[]>([])
const grantSelectedMedalId = ref<string | null>(null)
const grantExpireTime = ref<number | null>(null)
const grantData = ref('')

function showGrantModal() {
  grantSelectedUsers.value = []
  grantSelectedMedalId.value = null
  grantExpireTime.value = null
  grantData.value = ''
  grantModalVisible.value = true
}

const grantSubmitting = ref(false)

// 勋章选择选项
const medalOptions = computed(() =>
  medals.value.map((m) => ({
    label: `${m.name} (${m.medalId})`,
    value: m.medalId,
  }))
)

async function handleGrant() {
  if (grantSelectedUsers.value.length === 0) {
    message.warning('请选择至少一个用户')
    return
  }
  if (!grantSelectedMedalId.value) {
    message.warning('请选择勋章')
    return
  }
  grantSubmitting.value = true
  try {
    const result = await medalApi.grantMedalBatch({
      userIds: grantSelectedUsers.value.map((u) => u.oId),
      medalId: grantSelectedMedalId.value,
      expireTime: grantExpireTime.value || undefined,
      data: grantData.value || undefined,
    })

    if (result.dev_mode) {
      message.warning(
        `[开发模式] 批量授予完成：共 ${result.total} 人，成功 ${result.success}，跳过 ${result.skipped}，失败 ${result.failed}（未实际发放）`
      )
    } else {
      message.success(
        `批量授予完成：共 ${result.total} 人，成功 ${result.success}，跳过 ${result.skipped}，失败 ${result.failed}`
      )
    }
    grantModalVisible.value = false
  } catch (error) {
    console.error('授予失败:', error)
  } finally {
    grantSubmitting.value = false
  }
}

// ==================== 搜索勋章 ====================
const searchModalVisible = ref(false)
const searchKeyword = ref('')
const searchLoading = ref(false)
const searchResults = ref<Medal[]>([])

function showSearchModal() {
  searchKeyword.value = ''
  searchResults.value = []
  searchModalVisible.value = true
}

async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    message.warning('请输入搜索关键词')
    return
  }
  searchLoading.value = true
  try {
    const result = await medalApi.searchMedals(searchKeyword.value.trim())
    searchResults.value = result.items || []
    if (searchResults.value.length === 0) {
      message.info('未找到匹配的勋章')
    }
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    searchLoading.value = false
  }
}

// 初始化
onMounted(() => {
  if (isAdmin.value) {
    loadMedals()
  }
})
</script>

<template>
  <div v-if="isAdmin" class="medal-admin">
    <n-card title="勋章管理">
      <!-- 功能按钮 -->
      <template #header-extra>
        <n-space>
          <n-dropdown
            trigger="click"
            :options="[
              { label: '同步所有勋章', key: 'sync-all' },
              { label: '同步指定勋章', key: 'sync-single' },
              { label: '同步所有勋章拥有者', key: 'sync-all-owners' },
              { label: '同步指定勋章拥有者', key: 'sync-single-owners' },
              { label: '同步用户勋章', key: 'sync-user' },
            ]"
            @select="
              (key) => {
                switch (key) {
                  case 'sync-all':
                    syncAllMedals()
                    break
                  case 'sync-single':
                    showSyncSingleModal()
                    break
                  case 'sync-all-owners':
                    syncAllOwners()
                    break
                  case 'sync-single-owners':
                    showSyncOwnersModal()
                    break
                  case 'sync-user':
                    showSyncUserModal()
                    break
                }
              }
            "
          >
            <n-button :loading="syncLoading">
              <template #icon>
                <n-icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6c0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8m0 14c-3.31 0-6-2.69-6-6c0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4l-4-4z"
                    />
                  </svg>
                </n-icon>
              </template>
              同步数据
            </n-button>
          </n-dropdown>

          <n-button type="primary" @click="showCreateModal">
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
                </svg>
              </n-icon>
            </template>
            添加勋章
          </n-button>

          <n-button @click="showGrantModal">授予勋章</n-button>

          <n-button @click="showSearchModal">搜索勋章</n-button>
        </n-space>
      </template>

      <!-- 勋章表格 -->
      <n-data-table
        :columns="columns"
        :data="medals"
        :loading="loading"
        :pagination="false"
        :row-key="(row: Medal) => row.medalId"
      />
      <!-- 分页 -->
      <n-flex justify="end" style="margin-top: 16px">
        <n-pagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :item-count="pagination.itemCount"
          :page-sizes="[10, 20, 50]"
          show-size-picker
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </n-flex>
    </n-card>

    <!-- 勋章详情弹窗 -->
    <n-modal v-model:show="detailModalVisible" preset="card" title="勋章详情" style="width: 600px">
      <n-descriptions v-if="currentMedal" :column="1" bordered>
        <n-descriptions-item label="勋章ID">{{ currentMedal.medalId }}</n-descriptions-item>
        <n-descriptions-item label="OId">{{ currentMedal.oId }}</n-descriptions-item>
        <n-descriptions-item label="名称">
          <span :style="{ color: MEDAL_TYPE_COLORS[currentMedal.type] || '#333', fontWeight: 'bold' }">
            {{ currentMedal.name }}
          </span>
        </n-descriptions-item>
        <n-descriptions-item label="类型">{{ currentMedal.type }}</n-descriptions-item>
        <n-descriptions-item label="描述">{{ currentMedal.description || '-' }}</n-descriptions-item>
        <n-descriptions-item label="属性">{{ currentMedal.attr || '-' }}</n-descriptions-item>
        <n-descriptions-item label="预览">
          <img
            v-if="parseMedalAttr(currentMedal.attr).url"
            :src="parseMedalAttr(currentMedal.attr).url"
            style="max-height: 64px; border-radius: 4px"
          />
          <span v-else>-</span>
        </n-descriptions-item>
        <n-descriptions-item label="创建时间">{{ currentMedal.created }}</n-descriptions-item>
        <n-descriptions-item label="更新时间">{{ currentMedal.updated }}</n-descriptions-item>
      </n-descriptions>
    </n-modal>

    <!-- 创建/编辑勋章弹窗 -->
    <n-modal
      v-model:show="editModalVisible"
      preset="card"
      :title="isEditing ? '编辑勋章' : '添加勋章'"
      style="width: 600px"
    >
      <n-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-placement="left" label-width="80">
        <n-form-item label="名称" path="name">
          <n-input v-model:value="editForm.name" placeholder="请输入勋章名称" />
        </n-form-item>
        <n-form-item label="类型" path="type">
          <n-select v-model:value="editForm.type" :options="MEDAL_TYPE_OPTIONS" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="editForm.description" type="textarea" placeholder="请输入描述" />
        </n-form-item>
        <n-form-item label="图片URL">
          <n-input v-model:value="editForm.url" placeholder="请输入图片URL" />
        </n-form-item>
        <n-form-item label="背景色">
          <n-input v-model:value="editForm.backcolor" placeholder="如: db5a6b" />
        </n-form-item>
        <n-form-item label="字体色">
          <n-input v-model:value="editForm.fontcolor" placeholder="如: ffffff" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="editModalVisible = false">取消</n-button>
          <n-button type="primary" :loading="editSubmitting" @click="handleEditSubmit">
            {{ isEditing ? '保存' : '创建' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 勋章拥有者弹窗 -->
    <n-modal
      v-model:show="ownersModalVisible"
      preset="card"
      :title="`勋章拥有者 - ${ownersMedal?.name || ''}`"
      style="width: 800px"
    >
      <n-space vertical>
        <n-button
          size="small"
          :loading="syncLoading && syncType === 'modal-owners'"
          @click="
            async () => {
              if (!ownersMedal) return
              syncLoading = true
              syncType = 'modal-owners'
              try {
                const result = await medalApi.syncSingleMedalOwners(ownersMedal.medalId)
                message.success(`同步完成：创建 ${result.created}，更新 ${result.updated}，删除 ${result.deleted}`)
                loadOwners()
              } catch (error) {
                console.error('同步失败:', error)
              } finally {
                syncLoading = false
                syncType = ''
              }
            }
          "
        >
          从鱼排同步拥有者
        </n-button>
        <n-data-table
          :columns="ownersColumns"
          :data="owners"
          :loading="ownersLoading"
          :pagination="false"
          :row-key="(row: MedalOwner) => row.id"
        />
        <n-flex justify="end" style="margin-top: 12px">
          <n-pagination
            v-model:page="ownersPagination.page"
            :item-count="ownersPagination.itemCount"
            :page-size="ownersPagination.pageSize"
            @update:page="handleOwnersPageChange"
          />
        </n-flex>
      </n-space>
    </n-modal>

    <!-- 同步指定勋章弹窗 -->
    <n-modal v-model:show="syncSingleModalVisible" preset="card" title="同步指定勋章" style="width: 400px">
      <n-form-item label="勋章ID">
        <n-input v-model:value="syncSingleMedalId" placeholder="请输入勋章ID" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="syncSingleModalVisible = false">取消</n-button>
          <n-button type="primary" :loading="syncLoading" @click="handleSyncSingle">同步</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 同步指定勋章拥有者弹窗 -->
    <n-modal v-model:show="syncOwnersModalVisible" preset="card" title="同步指定勋章拥有者" style="width: 400px">
      <n-form-item label="勋章ID">
        <n-input v-model:value="syncOwnersMedalId" placeholder="请输入勋章ID" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="syncOwnersModalVisible = false">取消</n-button>
          <n-button type="primary" :loading="syncLoading" @click="handleSyncOwners">同步</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 同步用户勋章弹窗 -->
    <n-modal v-model:show="syncUserModalVisible" preset="card" title="同步用户勋章" style="width: 400px">
      <n-form-item label="用户ID">
        <n-input v-model:value="syncUserId" placeholder="请输入用户ID" />
      </n-form-item>
      <template #footer>
        <n-space justify="end">
          <n-button @click="syncUserModalVisible = false">取消</n-button>
          <n-button type="primary" :loading="syncLoading" @click="handleSyncUser">同步</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 授予勋章弹窗 -->
    <n-modal v-model:show="grantModalVisible" preset="card" title="批量授予勋章" style="width: 800px; max-height: 90vh">
      <n-scrollbar style="max-height: calc(90vh - 150px)">
        <n-form label-placement="top">
          <n-form-item label="选择勋章" required>
            <n-select
              v-model:value="grantSelectedMedalId"
              :options="medalOptions"
              placeholder="请选择要授予的勋章"
              filterable
            />
          </n-form-item>
          <n-form-item label="选择用户" required>
            <UserSelector v-model:selected-users="grantSelectedUsers" />
          </n-form-item>
          <n-form-item label="过期时间">
            <n-date-picker
              v-model:value="grantExpireTime"
              type="datetime"
              clearable
              placeholder="选择过期时间（留空表示永不过期）"
              style="width: 100%"
            />
          </n-form-item>
          <n-form-item label="附加数据">
            <n-input v-model:value="grantData" type="textarea" placeholder="附加数据（可选）" />
          </n-form-item>
        </n-form>
      </n-scrollbar>
      <template #footer>
        <n-space justify="end">
          <n-text v-if="grantSelectedUsers.length > 0" depth="3">
            已选择 {{ grantSelectedUsers.length }} 个用户
          </n-text>
          <n-button @click="grantModalVisible = false">取消</n-button>
          <n-button
            type="primary"
            :loading="grantSubmitting"
            :disabled="grantSelectedUsers.length === 0 || !grantSelectedMedalId"
            @click="handleGrant"
          >
            批量授予
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 搜索勋章弹窗 -->
    <n-modal v-model:show="searchModalVisible" preset="card" title="搜索勋章" style="width: 700px">
      <n-space vertical>
        <n-input-group>
          <n-input v-model:value="searchKeyword" placeholder="输入勋章ID、名称或描述" @keyup.enter="handleSearch" />
          <n-button type="primary" :loading="searchLoading" @click="handleSearch">搜索</n-button>
        </n-input-group>
        <n-data-table
          v-if="searchResults.length > 0"
          :columns="[
            { title: 'ID', key: 'medal_id', width: 100 },
            {
              title: '名称',
              key: 'medal_name',
              render: (row: any) =>
                h('span', { style: { color: MEDAL_TYPE_COLORS[row.medal_type] || '#333' } }, row.medal_name),
            },
            { title: '类型', key: 'medal_type', width: 80 },
            { title: '描述', key: 'medal_description', ellipsis: { tooltip: true } },
          ]"
          :data="searchResults"
          :row-key="(row: any) => row.oId"
          size="small"
        />
        <n-empty v-else-if="searchKeyword && !searchLoading" description="暂无搜索结果" />
      </n-space>
    </n-modal>
  </div>
</template>

<style scoped>
.medal-admin {
  padding: 16px;
}
</style>
