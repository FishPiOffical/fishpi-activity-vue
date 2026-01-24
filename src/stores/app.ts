/**
 * 应用全局状态管理
 */

import { defineStore } from 'pinia'
import { STORAGE_KEYS } from '@/constants'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useAppStore = defineStore(
    'app',
    () => {
        // 主题模式
        const themeMode = ref<ThemeMode>('auto')

        // 系统是否偏好深色
        const prefersDark = usePreferredDark()

        // 实际使用的深色模式
        const isDark = computed(() => {
            if (themeMode.value === 'auto') {
                return prefersDark.value
            }
            return themeMode.value === 'dark'
        })

        // 设置主题模式
        function setThemeMode(mode: ThemeMode) {
            themeMode.value = mode
        }

        // 切换主题
        function toggleTheme() {
            if (themeMode.value === 'auto') {
                themeMode.value = prefersDark.value ? 'light' : 'dark'
            } else {
                themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark'
            }
        }

        return {
            themeMode,
            isDark,
            setThemeMode,
            toggleTheme,
        }
    },
    {
        persist: {
            key: STORAGE_KEYS.USER_PREFERENCES,
            pick: ['themeMode'],
        },
    }
)
