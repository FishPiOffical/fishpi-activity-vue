/**
 * 积分管理相关接口封装
 */

import { BASE_URL } from '@/config'

// API 路径
export const API_POINT = {
    LIST: '/backend/admin/point/list',
    BATCH_CREATE: '/backend/admin/point/batch/create',
    BATCH_DISTRIBUTE: '/backend/admin/point/batch/distribute',
    BATCH_RETRY: '/backend/admin/point/batch/retry',
    DELETE: (id: string) => `/backend/admin/point/delete/${id}`,
    BATCH_DELETE: '/backend/admin/point/batch/delete',
} as const

// 积分状态
export const PointStatus = {
    PENDING: 'pending',
    DISTRIBUTING: 'distributing',
    SUCCESS: 'success',
    FAILED: 'failed',
} as const

export type PointStatusType = typeof PointStatus[keyof typeof PointStatus]

// 积分状态选项
export const POINT_STATUS_OPTIONS = [
    { label: '待发放', value: PointStatus.PENDING },
    { label: '发放中', value: PointStatus.DISTRIBUTING },
    { label: '发放成功', value: PointStatus.SUCCESS },
    { label: '发放失败', value: PointStatus.FAILED },
]

// 积分状态颜色
export const POINT_STATUS_COLORS: Record<string, string> = {
    [PointStatus.PENDING]: 'warning',
    [PointStatus.DISTRIBUTING]: 'info',
    [PointStatus.SUCCESS]: 'success',
    [PointStatus.FAILED]: 'error',
}

// 积分状态标签
export const POINT_STATUS_LABELS: Record<string, string> = {
    [PointStatus.PENDING]: '待发放',
    [PointStatus.DISTRIBUTING]: '发放中',
    [PointStatus.SUCCESS]: '发放成功',
    [PointStatus.FAILED]: '发放失败',
}

/** 积分记录类型 */
export interface PointRecord {
    id: string
    group: string
    userId: string
    point: number
    status: PointStatusType
    memo: string
    created: string
    updated: string
    expand?: {
        userId?: {
            id: string
            oId: string
            name: string
            nickname: string
            avatar: string
        }
    }
}

/** 分页响应 */
export interface PointListResponse {
    items: PointRecord[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    groups: string[]
}

// 消息提示实例
let messageApi: ReturnType<typeof useMessage> | null = null

/**
 * 设置消息提示 API
 */
export function setPointMessageApi(api: ReturnType<typeof useMessage>) {
    messageApi = api
}

/**
 * 获取请求头（包含认证信息）
 */
function getHeaders(): HeadersInit {
    const token = localStorage.getItem('pocketbase_auth')
    let authToken = ''
    if (token) {
        try {
            const parsed = JSON.parse(token)
            authToken = parsed.token || ''
        } catch {
            authToken = ''
        }
    }
    return {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': authToken } : {}),
    }
}

/**
 * 统一错误处理
 */
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `请求失败 (${response.status})`
        if (messageApi) {
            messageApi.error(errorMessage)
        }
        throw new Error(errorMessage)
    }
    return response.json()
}

/**
 * 获取积分记录列表
 */
export async function getPointList(params: {
    page?: number
    pageSize?: number
    status?: string
    group?: string
}): Promise<PointListResponse> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', String(params.page))
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))
    if (params.status) searchParams.set('status', params.status)
    if (params.group) searchParams.set('group', params.group)

    const response = await fetch(`${BASE_URL}${API_POINT.LIST}?${searchParams.toString()}`, {
        headers: getHeaders(),
    })
    return handleResponse<PointListResponse>(response)
}

/**
 * 批量创建积分记录
 */
export async function batchCreatePoints(data: {
    userIds: string[]
    point: number
    memo: string
    group: string
}): Promise<{
    total: number
    created: number
    skipped: number
    failed: number
}> {
    const response = await fetch(`${BASE_URL}${API_POINT.BATCH_CREATE}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    })
    return handleResponse(response)
}

/**
 * 批量发放积分
 */
export async function batchDistributePoints(ids: string[]): Promise<{
    total: number
    success: number
    failed: number
    skipped: number
    dev_mode: boolean
    results: Array<{ id: string; success: boolean; error?: string }>
}> {
    const response = await fetch(`${BASE_URL}${API_POINT.BATCH_DISTRIBUTE}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ids }),
    })
    return handleResponse(response)
}

/**
 * 批量重试发放
 */
export async function batchRetryPoints(ids: string[]): Promise<{
    total: number
    success: number
    failed: number
    dev_mode: boolean
    results: Array<{ id: string; success: boolean; error?: string }>
}> {
    const response = await fetch(`${BASE_URL}${API_POINT.BATCH_RETRY}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ids }),
    })
    return handleResponse(response)
}

/**
 * 删除积分记录
 */
export async function deletePoint(id: string): Promise<{ deleted: boolean }> {
    const response = await fetch(`${BASE_URL}${API_POINT.DELETE(id)}`, {
        method: 'DELETE',
        headers: getHeaders(),
    })
    return handleResponse(response)
}

/**
 * 批量删除积分记录
 */
export async function batchDeletePoints(ids: string[]): Promise<{
    total: number
    deleted: number
    skipped: number
}> {
    const response = await fetch(`${BASE_URL}${API_POINT.BATCH_DELETE}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ids }),
    })
    return handleResponse(response)
}

export default {
    getPointList,
    batchCreatePoints,
    batchDistributePoints,
    batchRetryPoints,
    deletePoint,
    batchDeletePoints,
    setPointMessageApi,
}
