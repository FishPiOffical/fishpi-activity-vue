import PocketBase from 'pocketbase'
import { BACKEND_URL } from '@/utils/constants'
import { createDiscreteApi } from 'naive-ui'

export const pb = new PocketBase(BACKEND_URL)

// Initialize discrete API for using message outside components
const { message } = createDiscreteApi(['message'])

const originalSend = pb.send

pb.send = async function (path, options) {
    try {
        const result = await originalSend.call(this, path, options)
        return result
    } catch (err) {
        // Global error handling
        // Detect abnormal status codes (usually SDK throws for >= 400)
        if (err.status && err.status >= 400) {
            // Extract 'message' field from response body
            const msg = err.response?.message || err.message || 'Unknown error'
            message.error(msg)
        }
        throw err
    }
}
