export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8090'

export const FISHPI_LOGIN_URL = `${BACKEND_URL}/backend/fishpi/login`
export const FISHPI_VERIFY_ENDPOINT = '/backend/fishpi/verify'

// Activity Collection Constants
export const ACTIVITIES_COLLECTION = 'activities'
export const ACTIVITY_FIELDS = {
    NAME: 'name',
    SLUG: 'slug',
    ARTICLE_URL: 'articleUrl',
    EXTERNAL_URL: 'externalUrl',
    DESC: 'desc',
    TAG: 'tag',
    START: 'start',
    END: 'end',
    VOTE_ID: 'voteId',
    REWARD_GROUP_ID: 'rewardGroupId',
    REWARD_DISTRIBUTION_STATUS: 'rewardDistributionStatus',
    HIDE_IN_LIST: 'hideInList',
    CHILD_ACTIVITY_IDS: 'childActivityIds',
    IMAGE: 'image',
    CREATED: 'created',
    UPDATED: 'updated'
}

export const PAGE_SIZE = 10
