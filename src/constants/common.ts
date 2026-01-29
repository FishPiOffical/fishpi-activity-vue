/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
    /** 主题模式 */
    THEME_MODE: 'theme-mode',
    /** 用户偏好设置 */
    USER_PREFERENCES: 'user-preferences',
} as const

/**
 * 路由名称常量
 */
export const ROUTE_NAMES = {
    HOME: 'index',
    REDIRECT: 'redirect',
    ADMIN: 'admin',
    ADMIN_MEDAL: 'admin-medal',
    ADMIN_POINT: 'admin-point',
} as const

/**
 * 路由路径常量
 */
export const ROUTE_PATHS = {
    HOME: '/',
    REDIRECT: '/redirect',
    ADMIN: '/admin',
    ADMIN_MEDAL: '/admin/medal',
    ADMIN_POINT: '/admin/point',
} as const

/**
 * 事件名称常量
 */
export const EVENT_NAMES = {
    /** 用户登录成功 */
    USER_LOGIN: 'user:login',
    /** 用户登出 */
    USER_LOGOUT: 'user:logout',
    /** 主题切换 */
    THEME_CHANGE: 'theme:change',
} as const

/**
 * 重定向倒计时（秒）
 */
export const REDIRECT_COUNTDOWN = 5
