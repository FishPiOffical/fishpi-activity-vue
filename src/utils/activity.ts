/**
 * 活动状态计算工具
 */

import dayjs from 'dayjs'
import { ActivityStatus } from '@/constants'
import type { Activity } from '@/types'

/**
 * 获取活动状态
 * @param activity 活动对象
 */
export function getActivityStatus(activity: Activity): ActivityStatus {
    const now = dayjs()
    const start = dayjs(activity.start)
    const end = dayjs(activity.end)

    if (now.isBefore(start)) {
        return ActivityStatus.UPCOMING
    } else if (now.isAfter(end)) {
        return ActivityStatus.ENDED
    } else {
        return ActivityStatus.ACTIVE
    }
}

/**
 * 格式化日期
 * @param dateString 日期字符串
 * @param format 格式
 */
export function formatDate(dateString: string, format: 'date' | 'datetime' = 'date'): string {
    if (format === 'datetime') {
        return dayjs(dateString).format('YYYY-MM-DD HH:mm')
    }
    return dayjs(dateString).format('YYYY-MM-DD')
}

/**
 * 计算活动剩余天数
 * @param activity 活动对象
 */
export function getActivityRemainingDays(activity: Activity): number {
    return dayjs(activity.end).diff(dayjs(), 'day')
}

/**
 * 计算活动开始倒计时天数
 * @param activity 活动对象
 */
export function getActivityStartCountdown(activity: Activity): number {
    return dayjs(activity.start).diff(dayjs(), 'day')
}

