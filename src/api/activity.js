import { pb } from '@/api/pocketbase'
import { ACTIVITIES_COLLECTION } from '@/utils/constants'

export const getActivities = async (page = 1, perPage = 20, filter = '') => {
    return await pb.collection(ACTIVITIES_COLLECTION).getList(page, perPage, {
        filter: filter,
        sort: '-created',
    })
}

export const getActivity = async (id) => {
    return await pb.collection(ACTIVITIES_COLLECTION).getOne(id)
}
