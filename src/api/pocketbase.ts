/**
 * PocketBase 客户端封装
 * 统一管理 PocketBase 实例和错误处理
 */

import PocketBase, { ClientResponseError } from 'pocketbase'
import { PB_URL } from '@/config'

// 创建 PocketBase 实例
export const pb = new PocketBase(PB_URL)
console.log('pocketbase:', pb)

// 禁用自动取消请求（避免组件卸载时取消正在进行的请求）
pb.autoCancellation(false)

// 消息提示实例（需要在应用初始化后设置）
let messageApi: ReturnType<typeof useMessage> | null = null

/**
 * 设置消息提示 API
 * 需要在 App.vue 中调用此函数
 */
export function setMessageApi(api: ReturnType<typeof useMessage>) {
    messageApi = api
}

/**
 * 统一错误处理
 * @param error 错误对象
 * @param showMessage 是否显示错误提示
 */
export function handlePbError(error: unknown, showMessage = true): string {
    let errorMessage = '未知错误'

    if (error instanceof ClientResponseError) {
        // PocketBase 客户端错误
        errorMessage = error.message || `请求失败 (${error.status})`

        // 尝试从 response.data 中获取更详细的错误信息
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message
        } else if (error.response?.message) {
            errorMessage = error.response.message
        }

        // 特殊状态码处理
        switch (error.status) {
            case 401:
                errorMessage = '未授权，请重新登录'
                // 可以在这里触发登出逻辑
                break
            case 403:
                errorMessage = '没有权限执行此操作'
                break
            case 404:
                errorMessage = '请求的资源不存在'
                break
            case 500:
                errorMessage = '服务器内部错误'
                break
        }
    } else if (error instanceof Error) {
        errorMessage = error.message
    }

    // 显示错误提示
    if (showMessage && messageApi) {
        messageApi.error(errorMessage)
    }

    console.error('PocketBase Error:', error)
    return errorMessage
}

/**
 * 包装 PocketBase 请求，添加统一错误处理
 * @param request 请求函数
 * @param showMessage 是否显示错误提示
 */
export async function withErrorHandling<T>(
    request: () => Promise<T>,
    showMessage = true
): Promise<T> {
    try {
        return await request()
    } catch (error) {
        handlePbError(error, showMessage)
        throw error
    }
}

export default pb
