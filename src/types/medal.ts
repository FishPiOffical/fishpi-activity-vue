/**
 * 勋章相关类型定义
 */

/** 勋章类型常量 */
export const MedalType = {
    NORMAL: '普通',
    FINE: '精良',
    RARE: '稀有',
    EPIC: '史诗',
    LEGENDARY: '传说',
    MYTHIC: '神话',
    FINITE: '限定',
} as const

export type MedalTypeValue = typeof MedalType[keyof typeof MedalType]

/** 勋章类型选项 */
export const MEDAL_TYPE_OPTIONS = [
    { label: '普通', value: '普通' },
    { label: '精良', value: '精良' },
    { label: '稀有', value: '稀有' },
    { label: '史诗', value: '史诗' },
    { label: '传说', value: '传说' },
    { label: '神话', value: '神话' },
    { label: '限定', value: '限定' },
]

/** 勋章类型颜色映射 */
export const MEDAL_TYPE_COLORS: Record<string, string> = {
    '普通': '#333333',
    '精良': '#3498db',
    '稀有': '#9b59b6',
    '史诗': '#e67e22',
    '传说': '#f1c40f',
    '神话': '#ffd700',
    '限定': '#e74c3c',
}

/** 勋章信息 */
export interface Medal {
    id: string
    oId: string
    medalId: string
    type: string
    name: string
    description: string
    attr: string
    created: string
    updated: string
}

/** 勋章拥有者信息 */
export interface MedalOwner {
    id: string
    medalId: string
    userId: string
    display: boolean
    displayOrder: number
    data: string
    expired: string
    created: string
    updated: string
    expand?: {
        userId?: {
            id: string
            name: string
            nickname: string
            avatar: string
        }
    }
}

/** 分页响应 */
export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

/** 解析勋章属性 */
export function parseMedalAttr(attr: string): {
    url?: string
    backcolor?: string
    fontcolor?: string
} {
    if (!attr) return {}
    const result: Record<string, string> = {}
    const pairs = attr.split('&')
    for (const pair of pairs) {
        const [key, value] = pair.split('=')
        if (key && value) {
            result[key] = value
        }
    }
    return result
}

/** 构建勋章属性字符串 */
export function buildMedalAttr(data: {
    url?: string
    backcolor?: string
    fontcolor?: string
}): string {
    const parts: string[] = []
    if (data.url) parts.push(`url=${data.url}`)
    if (data.backcolor) parts.push(`backcolor=${data.backcolor}`)
    if (data.fontcolor) parts.push(`fontcolor=${data.fontcolor}`)
    return parts.join('&')
}
