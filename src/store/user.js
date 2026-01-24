import { defineStore } from 'pinia'
import { pb } from '@/api/pocketbase'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
    const user = ref(pb.authStore.model)
    const token = ref(pb.authStore.token)

    // Sync from PB to Pinia
    pb.authStore.onChange((newToken, newModel) => {
        token.value = newToken
        user.value = newModel
    })

    const login = (newToken, newUser) => {
        pb.authStore.save(newToken, newUser)
    }

    const logout = () => {
        pb.authStore.clear()
    }

    return {
        user,
        token,
        login,
        logout
    }
}, {
    persist: true
})
