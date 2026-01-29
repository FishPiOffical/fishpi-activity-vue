/**
 * 勋章管理相关接口封装
 */

import { BASE_URL } from '@/config'
import type { Medal, MedalOwner, PaginatedResponse } from '@/types'

// API 路径
export const API_MEDAL = {
    LIST: '/backend/admin/medal/list',
    DETAIL: (medalId: string) => `/backend/admin/medal/detail/${medalId}`,
    CREATE: '/backend/admin/medal/create',
    EDIT: (medalId: string) => `/backend/admin/medal/edit/${medalId}`,
    DELETE: (medalId: string) => `/backend/admin/medal/delete/${medalId}`,
    SYNC_ALL: '/backend/admin/medal/sync/all',
    SYNC_SINGLE: (medalId: string) => `/backend/admin/medal/sync/${medalId}`,
    SYNC_OWNERS_ALL: '/backend/admin/medal/sync/owners/all',
    SYNC_OWNERS_SINGLE: (medalId: string) => `/backend/admin/medal/sync/owners/${medalId}`,
    SYNC_USER: (userId: string) => `/backend/admin/medal/sync/user/${userId}`,
    OWNERS: (medalId: string) => `/backend/admin/medal/owners/${medalId}`,
    GRANT: '/backend/admin/medal/grant',
    GRANT_BATCH: '/backend/admin/medal/grant/batch',
    REVOKE: '/backend/admin/medal/revoke',
    SEARCH: '/backend/admin/medal/search',
} as const

// 用户列表相关 API 路径
export const API_USER_LIST = {
    SEARCH: '/backend/admin/user-list/search',
    ACTIVITIES: '/backend/admin/user-list/activities',
    ACTIVITY_PARTICIPANTS: (activityId: string) => `/backend/admin/user-list/activity/${activityId}/participants`,
    VOTE_JURY: (voteId: string) => `/backend/admin/user-list/vote/${voteId}/jury`,
} as const

// 消息提示实例
let messageApi: ReturnType<typeof useMessage> | null = null

/**
 * 设置消息提示 API
 */
export function setMedalMessageApi(api: ReturnType<typeof useMessage>) {
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
 * 获取勋章列表
 */
export async function getMedalList(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Medal>> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.LIST}?page=${page}&pageSize=${pageSize}`, {
        headers: getHeaders(),
    })
    return handleResponse<PaginatedResponse<Medal>>(response)
}

/**
 * 获取勋章详情
 */
export async function getMedalDetail(medalId: string): Promise<{ medal: Medal }> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.DETAIL(medalId)}`, {
        headers: getHeaders(),
    })
    return handleResponse<{ medal: Medal }>(response)
}

/**
 * 创建勋章
 */
export async function createMedal(data: {
    name: string
    type: string
    description: string
    attr: string
}): Promise<{ medal: Medal }> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.CREATE}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    })
    return handleResponse<{ medal: Medal }>(response)
}

/**
 * 编辑勋章
 */
export async function editMedal(medalId: string, data: {
    name: string
    type: string
    description: string
    attr: string
}): Promise<{ medal: Medal }> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.EDIT(medalId)}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    })
    return handleResponse<{ medal: Medal }>(response)
}

/**
 * 删除勋章
 */
export async function deleteMedal(medalId: string): Promise<{ deleted: boolean }> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.DELETE(medalId)}`, {
        method: 'DELETE',
        headers: getHeaders(),
    })
    return handleResponse<{ deleted: boolean }>(response)
}

/**
 * 同步所有勋章
 */
export async function syncAllMedals(): Promise<{
    synced_count: number
    created_count: number
    updated_count: number
    deleted_count: number
}> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.SYNC_ALL}`, {
        method: 'POST',
        headers: getHeaders(),
    })
    return handleResponse(response)
}

/**
 * 同步单个勋章
 */
export async function syncSingleMedal(medalId: string): Promise<{
    created: boolean
    medal: Medal
}> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.SYNC_SINGLE(medalId)}`, {
        method: 'POST',
        headers: getHeaders(),
    })
    return handleResponse(response)
}

/**
 * 同步所有勋章的拥有者
 */
export async function syncAllMedalOwners(): Promise<{
    synced_count: number
    skipped_count: number
    total_created: number
    total_updated: number
    total_deleted: number
}> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.SYNC_OWNERS_ALL}`, {
        method: 'POST',
        headers: getHeaders(),
    })
    return handleResponse(response)
}

/**
 * 同步单个勋章的拥有者
 */
export async function syncSingleMedalOwners(medalId: string): Promise<{
    created: number
    updated: number
    deleted: number
}> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.SYNC_OWNERS_SINGLE(medalId)}`, {
        method: 'POST',
        headers: getHeaders(),
    })
    return handleResponse(response)
}

/**
 * 同步用户的所有勋章
 */
export async function syncUserMedals(userId: string): Promise<{
    total_medals: number
    created: number
    updated: number
    deleted: number
}> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.SYNC_USER(userId)}`, {
        method: 'POST',
        headers: getHeaders(),
    })
    return handleResponse(response)
}

/**
 * 获取勋章拥有者列表
 */
export async function getMedalOwners(medalId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<MedalOwner>> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.OWNERS(medalId)}?page=${page}&pageSize=${pageSize}`, {
        headers: getHeaders(),
    })
    return handleResponse<PaginatedResponse<MedalOwner>>(response)
}

/**
 * 授予用户勋章
 */
export async function grantMedal(data: {
    userId: string
    medalId: string
    expireTime?: number
    data?: string
}): Promise<{ success: boolean; created: boolean }> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.GRANT}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    })
    return handleResponse(response)
}

/**
 * 撤销用户勋章
 */
export async function revokeMedal(data: {
    userId: string
    medalId: string
}): Promise<{ success: boolean }> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.REVOKE}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    })
    return handleResponse(response)
}

/**
 * 搜索勋章
 */
export async function searchMedals(keyword: string): Promise<{ items: Medal[] }> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.SEARCH}?keyword=${encodeURIComponent(keyword)}`, {
        headers: getHeaders(),
    })
    return handleResponse<{ items: Medal[] }>(response)
}

/** 用户项类型 */
export interface UserItem {
    id: string
    oId: string
    name: string
    nickname: string
    avatar: string
}

/** 活动项类型 */
export interface ActivityItem {
    id: string
    name: string
    slug: string
    voteId: string
}

/**
 * 搜索用户
 */
export async function searchUsers(keyword: string): Promise<{ items: UserItem[] }> {
    const response = await fetch(`${BASE_URL}${API_USER_LIST.SEARCH}?keyword=${encodeURIComponent(keyword)}`, {
        headers: getHeaders(),
    })
    return handleResponse<{ items: UserItem[] }>(response)
}

/**
 * 获取活动列表
 */
export async function getActivities(): Promise<{ items: ActivityItem[] }> {
    const response = await fetch(`${BASE_URL}${API_USER_LIST.ACTIVITIES}`, {
        headers: getHeaders(),
    })
    return handleResponse<{ items: ActivityItem[] }>(response)
}

/**
 * 获取活动参与者
 */
export async function getActivityParticipants(activityId: string): Promise<{ items: UserItem[] }> {
    const response = await fetch(`${BASE_URL}${API_USER_LIST.ACTIVITY_PARTICIPANTS(activityId)}`, {
        headers: getHeaders(),
    })
    return handleResponse<{ items: UserItem[] }>(response)
}

/**
 * 获取评审团成员
 */
export async function getVoteJuryMembers(voteId: string): Promise<{ items: UserItem[] }> {
    const response = await fetch(`${BASE_URL}${API_USER_LIST.VOTE_JURY(voteId)}`, {
        headers: getHeaders(),
    })
    return handleResponse<{ items: UserItem[] }>(response)
}

/**
 * 批量授予勋章
 */
export async function grantMedalBatch(data: {
    userIds: string[]
    medalId: string
    expireTime?: number
    data?: string
}): Promise<{
    total: number
    success: number
    failed: number
    skipped: number
    dev_mode: boolean
    results: Array<{ userId: string; success: boolean; error?: string }>
}> {
    const response = await fetch(`${BASE_URL}${API_MEDAL.GRANT_BATCH}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    })
    return handleResponse(response)
}

export default {
    getMedalList,
    getMedalDetail,
    createMedal,
    editMedal,
    deleteMedal,
    syncAllMedals,
    syncSingleMedal,
    syncAllMedalOwners,
    syncSingleMedalOwners,
    syncUserMedals,
    getMedalOwners,
    grantMedal,
    grantMedalBatch,
    revokeMedal,
    searchMedals,
    searchUsers,
    getActivities,
    getActivityParticipants,
    getVoteJuryMembers,
    setMedalMessageApi,
}
