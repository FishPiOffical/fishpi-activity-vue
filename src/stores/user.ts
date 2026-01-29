/**
 * 用户状态管理
 */

import { defineStore } from 'pinia'
import { fishpi } from '@/api'
import type { User } from '@/types'
import { UserRole } from '@/types'

export const useUserStore = defineStore('user', () => {
    // 用户信息
    const user = ref<User | null>(null)

    // 是否已登录
    const isLoggedIn = computed(() => user.value !== null)

    // 是否是管理员
    const isAdmin = computed(() => user.value?.role === UserRole.ADMIN)

    // 初始化：从 authStore 恢复用户信息
    function init() {
        fishpi.initUserStore(user)
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
        isAdmin,
        init,
        setUser,
        logout,
        goToLogin,
    }
})
