import { defineStore } from 'pinia'
import { useColorMode, usePreferredDark } from '@vueuse/core'
import { computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
    // useColorMode handles 'light', 'dark', 'auto' modes and class management
    const mode = useColorMode({
        selector: 'html',
        attribute: 'class',
        modes: {
            light: '', // Tailwind: default is light, no class needed
            dark: 'dark',
        },
        storageKey: 'fishpi-theme-preference',
    })

    const preferredDark = usePreferredDark()

    const isDark = computed(() => {
        return mode.value === 'dark' || (mode.value === 'auto' && preferredDark.value)
    })

    const setTheme = (newTheme) => {
        mode.value = newTheme
    }

    return {
        mode,
        isDark,
        setTheme
    }
})
