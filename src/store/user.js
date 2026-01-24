import { defineStore } from 'pinia'
import { pb } from '@/api/pocketbase'

export const useUserStore = defineStore('user', {
    state: () => ({
        user: pb.authStore.model,
        token: pb.authStore.token
    }),
    actions: {
        login(token, user) {
            pb.authStore.save(token, user)
            this.token = token
            this.user = user
        },
        logout() {
            pb.authStore.clear()
            this.token = ''
            this.user = null
        }
    }
})
