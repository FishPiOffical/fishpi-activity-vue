/**
 * 应用配置
 * 所有配置项统一管理，避免硬编码
 */

// 后端接口基础地址
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://127.0.0.1:8090'

// PocketBase 配置
export const PB_URL = import.meta.env.VITE_PB_URL || BASE_URL

// 应用信息
export const APP_NAME = '摸鱼派活动'
export const APP_DESCRIPTION = '摸鱼派论坛活动专区'

// 分页配置
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50]
