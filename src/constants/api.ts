/**
 * API 路径常量
 * 所有接口路径统一管理
 */

// FishPi 相关接口
export const API_FISHPI = {
    LOGIN: '/backend/fishpi/login',
    VERIFY: '/backend/fishpi/verify',
    CALLBACK: '/backend/fishpi/callback',
} as const

// 用户相关接口
export const API_USER = {
    INFO: '/backend/user/info',
    LOGOUT: '/backend/user/logout',
} as const

// 活动相关接口
export const API_ACTIVITY = {
    LIST: '/activity-api/activities',
    REWARDS: (slug: string) => `/activity-api/activity/${slug}/rewards`,
    YEARS: (slug: string) => `/activity-api/activity/${slug}/years`,
    RECENT: '/activity-api/recent',
} as const

// PocketBase 集合名称
export const PB_COLLECTIONS = {
    USERS: 'users',
    ACTIVITIES: 'activities',
    USER_TOKENS: 'user_tokens',
} as const
