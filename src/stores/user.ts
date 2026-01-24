/**
 * 用户状态管理
 */

import { defineStore } from 'pinia'
import { pb, fishpi } from '@/api'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
    // 用户信息
    const user = ref<User | null>(null)
    console.log('authstore', pb.authStore)

    // 是否已登录
    const isLoggedIn = computed(() => pb.authStore.isValid)

    // 初始化：从 authStore 恢复用户信息
    function init() {
        if (pb.authStore.isValid && pb.authStore.record) {
            user.value = pb.authStore.record as unknown as User
        }

        // 监听 authStore 变化
        pb.authStore.onChange(() => {
            if (pb.authStore.isValid && pb.authStore.record) {
                user.value = pb.authStore.record as unknown as User
            } else {
                user.value = null
            }
        })
    }

    // 设置用户信息
    function setUser(userData: User) {
        user.value = userData
    }

    // 登出
    function logout() {
        fishpi.logout()
        user.value = null
    }

    // 跳转到登录
    function goToLogin(redirect?: string) {
        fishpi.redirectToLogin(redirect)
    }

    return {
        user,
        isLoggedIn,
        init,
        setUser,
        logout,
        goToLogin,
    }
})
