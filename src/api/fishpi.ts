/**
 * FishPi 相关接口封装
 * 处理鱼排登录、验证等接口
 */

import { API_FISHPI } from '@/constants'
import { BASE_URL } from '@/config'
import type { VerifyResponse, User } from '@/types'
import { pb, handlePbError } from './pocketbase'

// 消息提示实例
let messageApi: ReturnType<typeof useMessage> | null = null

// 用户状态引用
let userRef: { value: User | null } | null = null

/**
 * 设置消息提示 API
 */
export function setFishpiMessageApi(api: ReturnType<typeof useMessage>) {
    messageApi = api
}

/**
 * 初始化用户状态管理
 * 监听 PocketBase authStore 变化并更新用户状态
 */
export function initUserStore(userState: { value: User | null }) {
    userRef = userState

    // 初始状态：从 authStore 恢复用户信息
    if (pb.authStore.isValid && pb.authStore.record) {
        userRef.value = pb.authStore.record as unknown as User
    }

    // 监听 authStore 变化
    pb.authStore.onChange((_token, record) => {
        if (pb.authStore.isValid && record) {
            userRef!.value = record as unknown as User
        } else {
            userRef!.value = null
        }
    })
}

/**
 * 手动设置用户状态（用于登录后立即更新）
 */
export function setUserInfo(userData: User) {
    if (userRef) {
        userRef.value = userData
    }
}

/**
 * 获取登录地址
 * @param redirect 登录成功后的重定向地址
 */
export function getLoginUrl(redirect: string = '/'): string {
    const encodedRedirect = encodeURIComponent(redirect)
    return `${BASE_URL}${API_FISHPI.LOGIN}?redirect=${encodedRedirect}`
}

/**
 * 跳转到鱼排登录
 * @param redirect 登录成功后的重定向地址
 */
export function redirectToLogin(redirect?: string): void {
    const currentPath = redirect || window.location.pathname + window.location.search
    window.location.href = getLoginUrl(currentPath)
}

/**
 * 验证登录状态
 * @param id 用户令牌 ID
 */
export async function verifyLogin(id: string): Promise<VerifyResponse> {
    try {
        const response = await fetch(`${BASE_URL}${API_FISHPI.VERIFY}?id=${id}`)

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData.message || `验证失败 (${response.status})`

            if (messageApi) {
                messageApi.error(errorMessage)
            }

            throw new Error(errorMessage)
        }

        const data: VerifyResponse = await response.json()

        // 保存 token 到 PocketBase authStore
        pb.authStore.save(data.token, data.user)

        // 手动设置用户状态（确保立即更新）
        setUserInfo(data.user)

        return data
    } catch (error) {
        if (error instanceof Error && !error.message.includes('验证失败')) {
            handlePbError(error)
        }
        throw error
    }
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
    return pb.authStore.isValid
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser() {
    return pb.authStore.record
}

/**
 * 登出
 */
export function logout(): void {
    pb.authStore.clear()
}

export default {
    getLoginUrl,
    redirectToLogin,
    verifyLogin,
    isLoggedIn,
    getCurrentUser,
    logout,
    initUserStore,
}
