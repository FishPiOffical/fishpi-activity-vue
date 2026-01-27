/**
 * 鱼派相关工具函数和配置
 */

// 鱼派基础 URL
export const FISHPI_BASE_URL = 'https://fishpi.cn'

/**
 * 获取用户主页链接
 * @param username 用户名
 */
export function getUserProfileUrl(username: string): string {
  return `${FISHPI_BASE_URL}/member/${username}`
}

/**
 * 获取文章链接
 * @param articleId 文章ID
 */
export function getArticleUrl(articleId: string): string {
  return `${FISHPI_BASE_URL}/article/${articleId}`
}

/**
 * 获取用户头像链接（如果是相对路径则补全）
 * @param avatar 头像地址
 */
export function getAvatarUrl(avatar: string): string {
  if (!avatar) return ''
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  return `${FISHPI_BASE_URL}${avatar}`
}

export default {
  FISHPI_BASE_URL,
  getUserProfileUrl,
  getArticleUrl,
  getAvatarUrl,
}
