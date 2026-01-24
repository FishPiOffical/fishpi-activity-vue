/**
 * 活动相关接口封装
 */

import { pb, withErrorHandling } from './pocketbase'
import { PB_COLLECTIONS, API_ACTIVITY } from '@/constants'
import { BASE_URL } from '@/config'
import type { Activity, ActivityListResponse, RecentActivitiesResponse } from '@/types'

/**
 * 获取活动列表
 * @param page 页码
 * @param perPage 每页数量
 * @param filter 筛选条件
 */
export async function getActivities(
    page = 1,
    perPage = 10,
    filter = ''
): Promise<{ items: Activity[]; totalItems: number; totalPages: number }> {
    return withErrorHandling(async () => {
        // 默认过滤隐藏的活动
        const baseFilter = 'hideInList = false'
        const finalFilter = filter ? `${baseFilter} && ${filter}` : baseFilter

        const result = await pb.collection(PB_COLLECTIONS.ACTIVITIES).getList<Activity>(page, perPage, {
            filter: finalFilter,
            sort: '-start',
        })

        return {
            items: result.items,
            totalItems: result.totalItems,
            totalPages: result.totalPages,
        }
    })
}

/**
 * 获取单个活动详情
 * @param id 活动 ID
 */
export async function getActivity(id: string): Promise<Activity> {
    return withErrorHandling(async () => {
        return await pb.collection(PB_COLLECTIONS.ACTIVITIES).getOne<Activity>(id)
    })
}

/**
 * 根据 slug 获取活动
 * @param slug 活动标识
 */
export async function getActivityBySlug(slug: string): Promise<Activity | null> {
    return withErrorHandling(async () => {
        const result = await pb.collection(PB_COLLECTIONS.ACTIVITIES).getList<Activity>(1, 1, {
            filter: `slug = "${slug}"`,
        })
        return result.items[0] || null
    })
}

/**
 * 获取活动奖励信息
 * @param slug 活动标识
 */
export async function getActivityRewards(slug: string): Promise<Activity[]> {
    const response = await fetch(`${BASE_URL}${API_ACTIVITY.REWARDS(slug)}`)
    if (!response.ok) {
        throw new Error(`获取奖励信息失败 (${response.status})`)
    }
    const data: ActivityListResponse = await response.json()
    return data.items
}

/**
 * 获取近期活动（进行中 + 即将开始）
 * @param params 查询参数
 */
export async function getRecentActivities(
    params?: Record<string, string>
): Promise<RecentActivitiesResponse> {
    const searchParams = new URLSearchParams(params)
    const url = `${BASE_URL}${API_ACTIVITY.RECENT}${searchParams.toString() ? `?${searchParams}` : ''}`

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`获取近期活动失败 (${response.status})`)
    }
    return response.json()
}

export default {
    getActivities,
    getActivity,
    getActivityBySlug,
    getActivityRewards,
    getRecentActivities,
}
