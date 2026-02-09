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
    images: string[]
    metadata: ActivityMetadata
    created: string
    updated: string
    template?: 'default' | 'redirect' | 'article' // 活动模板类型
    // 扩展字段
    rewards?: Reward[]
}

/** 活动元数据 */
export interface ActivityMetadata {
    admin_user_id?: string
    promo_image?: string
    final_image?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
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

/** 活动提交文章 */
export interface Article {
    id: string
    activityId: string
    userId: string
    title: string
    content: string
    image: string
    created: string
    updated: string
    expand?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userId?: any
        activityId?: Activity
    }
}
