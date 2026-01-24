/**
 * 活动状态常量
 */
export const ActivityStatus = {
    /** 进行中 */
    ACTIVE: 'active',
    /** 即将开始 */
    UPCOMING: 'upcoming',
    /** 已结束 */
    ENDED: 'ended',
} as const

export type ActivityStatus = (typeof ActivityStatus)[keyof typeof ActivityStatus]

/**
 * 活动状态标签配置
 */
export const ACTIVITY_STATUS_CONFIG = {
    [ActivityStatus.ACTIVE]: {
        label: '进行中',
        type: 'success' as const,
    },
    [ActivityStatus.UPCOMING]: {
        label: '即将开始',
        type: 'warning' as const,
    },
    [ActivityStatus.ENDED]: {
        label: '已结束',
        type: 'default' as const,
    },
} as const

/**
 * 奖励发放状态常量
 */
export const DistributionStatus = {
    PENDING: 'pending',
    DISTRIBUTING: 'distributing',
    FAILED: 'failed',
    SUCCESS: 'success',
} as const

export type DistributionStatus = (typeof DistributionStatus)[keyof typeof DistributionStatus]

/**
 * 奖励发放状态标签配置
 */
export const DISTRIBUTION_STATUS_CONFIG = {
    [DistributionStatus.PENDING]: {
        label: '待发放',
        type: 'default' as const,
    },
    [DistributionStatus.DISTRIBUTING]: {
        label: '发放中',
        type: 'info' as const,
    },
    [DistributionStatus.FAILED]: {
        label: '发放失败',
        type: 'error' as const,
    },
    [DistributionStatus.SUCCESS]: {
        label: '发放成功',
        type: 'success' as const,
    },
} as const
