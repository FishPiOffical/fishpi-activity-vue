/**
 * 活动相关类型定义
 */

import type { DistributionStatus } from '@/constants'

/** 活动奖励 */
export interface Reward {
    name: string
    min: number
    max: number
    point: number
    more: string
    rewardGroupId?: string
    shieldIds?: string[]
}

/** 活动数据 */
export interface Activity {
    id: string
    name: string
    slug: string
    articleUrl: string
    externalUrl: string
    desc: string
    tag: string
    start: string
    end: string
    voteId: string
    rewardGroupId: string
    rewardDistributionStatus: DistributionStatus
    hideInList: boolean
    children: string[]
    image: string
    created: string
    updated: string
    // 扩展字段
    rewards?: Reward[]
}

/** 活动列表响应 */
export interface ActivityListResponse {
    items: Activity[]
}

/** 近期活动响应 */
export interface RecentActivitiesResponse {
    active: Activity[]
    upcoming: Activity[]
}
