import { pb } from '@/api/pocketbase'
import { FISHPI_VERIFY_ENDPOINT } from '@/utils/constants'

export const verifyFishpiLogin = async (id) => {
    if (!id) {
        throw new Error('Missing parameter: id')
    }

    return await pb.send(FISHPI_VERIFY_ENDPOINT, {
        method: 'GET',
        params: { id }
    })
}
