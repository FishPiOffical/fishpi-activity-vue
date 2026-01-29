<script setup lang="ts">
import pointApi, {
  type PointRecord,
  PointStatus,
  POINT_STATUS_OPTIONS,
  POINT_STATUS_COLORS,
  POINT_STATUS_LABELS,
} from '@/api/point'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'
import { NButton, NSpace, NTag, NAvatar, NEllipsis } from 'naive-ui'
import { useUserStore } from '@/stores'
import PointBatchCreate from '@/components/PointBatchCreate.vue'
import dayjs from 'dayjs'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()

// 格式化时间
function formatTime(time: string) {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 权限检查
const isAdmin = computed(() => userStore.isAdmin)

onMounted(() => {
  if (!isAdmin.value) {
    message.error('无权访问此页面')
    router.push('/')
  }
})

// 积分记录列表
const loading = ref(false)
const points = ref<PointRecord[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  pageCount: 0,
})

// 筛选条件
const filterStatus = ref<string>('')
const filterGroup = ref<string>('')
const groups = ref<string[]>([])

// 选中的行
const checkedRowKeys = ref<DataTableRowKey[]>([])

// 加载积分记录列表
async function loadPoints() {
  loading.value = true
  try {
    const result = await pointApi.getPointList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: filterStatus.value || undefined,
      group: filterGroup.value || undefined,
    })
    points.value = result.items || []
    pagination.itemCount = result.total
    pagination.pageCount = result.totalPages
    groups.value = result.groups || []
  } catch (error) {
    console.error('加载积分记录列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理分页变化
function handlePageChange(_page: number) {
  loadPoints()
}

function handlePageSizeChange(_pageSize: number) {
  pagination.page = 1
  loadPoints()
}

// 处理筛选变化
function handleFilterChange() {
  pagination.page = 1
  checkedRowKeys.value = []
  loadPoints()
}

// 表格列定义
const columns: DataTableColumns<PointRecord> = [
  {
    type: 'selection',
  },
  {
    title: '用户',
    key: 'userId',
    width: 200,
    render(row) {
      const user = row.expand?.userId
      if (user) {
        return h(NSpace, { align: 'center' }, () => [
          h(NAvatar, { src: user.avatar, size: 'small', round: true }),
          h('span', null, user.nickname || user.name),
        ])
      }
      return row.userId
    },
  },
  {
    title: '积分',
    key: 'point',
    width: 100,
    render(row) {
      const color = row.point > 0 ? 'success' : row.point < 0 ? 'error' : 'default'
      return h(NTag, { type: color, size: 'small' }, () => (row.point > 0 ? '+' : '') + row.point)
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: POINT_STATUS_COLORS[row.status] as any, size: 'small' },
        () => POINT_STATUS_LABELS[row.status] || row.status
      )
    },
  },
  {
    title: '分组',
    key: 'group',
    width: 120,
    ellipsis: { tooltip: true },
  },
  {
    title: '备注',
    key: 'memo',
    width: 200,
    render(row) {
      if (!row.memo) return '-'
      return h(NEllipsis, { style: 'max-width: 200px', tooltip: true }, () => row.memo)
    },
  },
  {
    title: '创建时间',
    key: 'created',
    width: 170,
    render(row) {
      return formatTime(row.created)
    },
  },
  {
    title: '更新时间',
    key: 'updated',
    width: 170,
    render(row) {
      return formatTime(row.updated)
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render(row) {
      if (row.status === PointStatus.SUCCESS) {
        return '-'
      }
      return h(
        NButton,
        {
          size: 'small',
          type: 'error',
          onClick: () => confirmDelete(row),
        },
        () => '删除'
      )
    },
  },
]

// 删除确认
function confirmDelete(record: PointRecord) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这条积分记录吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await pointApi.deletePoint(record.id)
        message.success('删除成功')
        loadPoints()
      } catch (error) {
        console.error('删除失败:', error)
      }
    },
  })
}

// ==================== 批量操作 ====================
const batchCreateVisible = ref(false)

// 批量发放
const batchDistributing = ref(false)

async function handleBatchDistribute() {
  if (checkedRowKeys.value.length === 0) {
    message.warning('请先选择要发放的记录')
    return
  }

  // 筛选出可发放的记录（待发放或失败）
  const validIds = checkedRowKeys.value.filter((id) => {
    const record = points.value.find((p) => p.id === id)
    return record && (record.status === PointStatus.PENDING || record.status === PointStatus.FAILED)
  }) as string[]

  if (validIds.length === 0) {
    message.warning('所选记录中没有可发放的记录')
    return
  }

  dialog.warning({
    title: '确认发放',
    content: `确定要发放选中的 ${validIds.length} 条记录吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      batchDistributing.value = true
      try {
        const result = await pointApi.batchDistributePoints(validIds)
        if (result.dev_mode) {
          message.warning(
            `[开发模式] 发放完成：共 ${result.total} 条，成功 ${result.success}，失败 ${result.failed}，跳过 ${result.skipped}（未实际发放）`
          )
        } else {
          message.success(
            `发放完成：共 ${result.total} 条，成功 ${result.success}，失败 ${result.failed}，跳过 ${result.skipped}`
          )
        }
        checkedRowKeys.value = []
        loadPoints()
      } catch (error) {
        console.error('发放失败:', error)
      } finally {
        batchDistributing.value = false
      }
    },
  })
}

// 批量重试
const batchRetrying = ref(false)

async function handleBatchRetry() {
  if (checkedRowKeys.value.length === 0) {
    message.warning('请先选择要重试的记录')
    return
  }

  // 筛选出失败的记录
  const failedIds = checkedRowKeys.value.filter((id) => {
    const record = points.value.find((p) => p.id === id)
    return record && record.status === PointStatus.FAILED
  }) as string[]

  if (failedIds.length === 0) {
    message.warning('所选记录中没有失败的记录')
    return
  }

  dialog.warning({
    title: '确认重试',
    content: `确定要重试选中的 ${failedIds.length} 条失败记录吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      batchRetrying.value = true
      try {
        const result = await pointApi.batchRetryPoints(failedIds)
        if (result.dev_mode) {
          message.warning(
            `[开发模式] 重试完成：共 ${result.total} 条，成功 ${result.success}，失败 ${result.failed}（未实际发放）`
          )
        } else {
          message.success(`重试完成：共 ${result.total} 条，成功 ${result.success}，失败 ${result.failed}`)
        }
        checkedRowKeys.value = []
        loadPoints()
      } catch (error) {
        console.error('重试失败:', error)
      } finally {
        batchRetrying.value = false
      }
    },
  })
}

// 批量删除
const batchDeleting = ref(false)

async function handleBatchDelete() {
  if (checkedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的记录')
    return
  }

  // 筛选出可删除的记录（非成功状态）
  const deletableIds = checkedRowKeys.value.filter((id) => {
    const record = points.value.find((p) => p.id === id)
    return record && record.status !== PointStatus.SUCCESS
  }) as string[]

  if (deletableIds.length === 0) {
    message.warning('所选记录中没有可删除的记录（已发放成功的不能删除）')
    return
  }

  dialog.warning({
    title: '确认删除',
    content: `确定要删除选中的 ${deletableIds.length} 条记录吗？此操作不可恢复。`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      batchDeleting.value = true
      try {
        const result = await pointApi.batchDeletePoints(deletableIds)
        message.success(`删除完成：共 ${result.total} 条，已删除 ${result.deleted}，跳过 ${result.skipped}`)
        checkedRowKeys.value = []
        loadPoints()
      } catch (error) {
        console.error('删除失败:', error)
      } finally {
        batchDeleting.value = false
      }
    },
  })
}

// 处理行选中变化
function handleCheckedRowKeysChange(keys: DataTableRowKey[]) {
  checkedRowKeys.value = keys
}

// 获取选中的统计信息
const selectedStats = computed(() => {
  const selected = points.value.filter((p) => checkedRowKeys.value.includes(p.id))
  return {
    total: selected.length,
    pending: selected.filter((p) => p.status === PointStatus.PENDING).length,
    failed: selected.filter((p) => p.status === PointStatus.FAILED).length,
    success: selected.filter((p) => p.status === PointStatus.SUCCESS).length,
  }
})

// 初始化
onMounted(() => {
  if (isAdmin.value) {
    loadPoints()
  }
})
</script>

<template>
  <div v-if="isAdmin" class="point-admin">
    <n-card title="积分管理">
      <!-- 功能按钮 -->
      <template #header-extra>
        <n-space>
          <n-button type="primary" @click="batchCreateVisible = true">
            <template #icon>
              <n-icon>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
                </svg>
              </n-icon>
            </template>
            批量创建
          </n-button>
          <n-button
            type="success"
            :loading="batchDistributing"
            :disabled="selectedStats.pending + selectedStats.failed === 0"
            @click="handleBatchDistribute"
          >
            批量发放
          </n-button>
          <n-button
            type="warning"
            :loading="batchRetrying"
            :disabled="selectedStats.failed === 0"
            @click="handleBatchRetry"
          >
            批量重试
          </n-button>
          <n-button
            type="error"
            :loading="batchDeleting"
            :disabled="selectedStats.total - selectedStats.success === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </n-button>
        </n-space>
      </template>

      <!-- 筛选栏 -->
      <n-space class="mb-4">
        <n-select
          v-model:value="filterStatus"
          :options="[{ label: '全部状态', value: '' }, ...POINT_STATUS_OPTIONS]"
          placeholder="筛选状态"
          style="width: 150px"
          @update:value="handleFilterChange"
        />
        <n-select
          v-model:value="filterGroup"
          :options="[{ label: '全部分组', value: '' }, ...groups.map((g) => ({ label: g, value: g }))]"
          placeholder="筛选分组"
          style="width: 150px"
          @update:value="handleFilterChange"
        />
        <n-button @click="loadPoints">刷新</n-button>
        <n-text v-if="checkedRowKeys.length > 0" depth="3">
          已选 {{ selectedStats.total }} 条（待发放 {{ selectedStats.pending }}，失败 {{ selectedStats.failed }}，成功
          {{ selectedStats.success }}）
        </n-text>
      </n-space>

      <!-- 积分表格 -->
      <n-data-table
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="points"
        :loading="loading"
        :pagination="false"
        :row-key="(row: PointRecord) => row.id"
        @update:checked-row-keys="handleCheckedRowKeysChange"
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

    <!-- 批量创建弹窗 -->
    <PointBatchCreate v-model:show="batchCreateVisible" @success="loadPoints" />
  </div>
</template>

<style scoped>
.point-admin {
  padding: 16px;
}
.mb-4 {
  margin-bottom: 16px;
}
</style>
