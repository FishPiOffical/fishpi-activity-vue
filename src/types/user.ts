/**
 * 用户相关类型定义
 */

import type { RecordModel } from 'pocketbase'

/** 用户信息 */
export interface User extends RecordModel {
    oId: string
    name: string
    nickname: string
    avatar: string
}

/** 登录验证响应 */
export interface VerifyResponse {
    token: string
    user: User
}

/** 用户信息响应 */
export interface UserInfoResponse extends User { }
