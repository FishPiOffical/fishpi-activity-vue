/**
 * 用户相关类型定义
 */

/** 用户信息 */
export interface User {
    id: string
    o_id: string
    name: string
    nickname: string
    avatar: string
    email?: string
    emailVisibility?: boolean
    verified?: boolean
    created?: string
    updated?: string
}

/** 登录验证响应 */
export interface VerifyResponse {
    token: string
    user: User
}

/** 用户信息响应 */
export interface UserInfoResponse extends User { }
