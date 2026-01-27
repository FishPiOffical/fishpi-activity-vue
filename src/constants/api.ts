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

// 评审团投票接口
export const API_VOTE_JURY = {
    INFO: (voteId: string) => `/backend/vote/jury/info/${voteId}`,
    CREATE_USER: '/backend/vote/jury/user/create',
    ADD_MEMBER: '/backend/vote/jury/member/add',
    AUDIT_APPLY: '/backend/vote/jury/apply/audit',
    SWITCH_STATUS: '/backend/vote/jury/status/switch',
    CALCULATE: '/backend/vote/jury/calculate',
    APPLY: '/backend/vote/jury/apply',
    VOTE: '/backend/vote/jury/vote',
    RESULT: (voteId: string) => `/backend/vote/jury/result/${voteId}`,
} as const

// PocketBase 集合名称
export const PB_COLLECTIONS = {
    USERS: 'users',
    ACTIVITIES: 'activities',
    USER_TOKENS: 'user_tokens',
} as const
