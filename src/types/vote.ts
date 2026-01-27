/**
 * 投票相关类型定义
 */

/** 投票类型 */
export type VoteType = 'normal' | 'jury'

/** 评审团状态 */
export type JuryStatus = 'pending' | 'applying' | 'publicity' | 'voting' | 'completed'

/** 评审团成员状态 */
export type JuryUserStatus = 'pending' | 'approved' | 'rejected'

/** 评审团申请状态 */
export type JuryApplyStatus = 'pending' | 'approved' | 'rejected'

/** 用户基础信息 */
export interface UserInfo {
  id: string
  name: string
  nickname: string
  avatar: string
}

/** 投票信息 */
export interface VoteInfo {
  id: string
  name: string
  desc: string
  type: VoteType
  times: number
  start: string
  end: string
}

/** 评审团规则 */
export interface JuryRule {
  id: string
  count: number
  admins: string[]
  decisions: string[]
  status: JuryStatus
  applyTime: string
  publicityTime: string
  currentRound: number
}

/** 评审团成员 */
export interface JuryMember extends UserInfo {}

/** 评审团申请记录 */
export interface JuryApplyLog {
  id: string
  userId: string
  reason: string
  status: JuryApplyStatus
  adminId: string
  user: UserInfo | null
  created: string
}

/** 单个投票结果 */
export interface VoteResultItem {
  userId: string
  count: number
  user: UserInfo | null
}

/** 轮次投票结果 */
export interface RoundResult {
  round: number
  results: VoteResultItem[]
  continue: boolean
  userIds: string[]
}

/** 投票进度 */
export interface VotingProgress {
  voted: number
  total: number
  unvoted: number
}

/** 获取评审团信息响应 */
export interface GetJuryInfoResponse {
  vote: VoteInfo
  rule: JuryRule
  members: JuryMember[]
  applyLogs: JuryApplyLog[] | null
  results: RoundResult[]
  votingProgress: VotingProgress | null
  isAdmin: boolean
}

/** 创建用户请求 */
export interface CreateUserRequest {
  voteId: string
  username: string
}

/** 创建用户响应 */
export interface CreateUserResponse {
  message: string
  user: UserInfo
}

/** 添加成员请求 */
export interface AddMemberRequest {
  voteId: string
  username: string
}

/** 添加成员响应 */
export interface AddMemberResponse {
  message: string
  member: UserInfo
}

/** 删除成员请求 */
export interface RemoveMemberRequest {
  voteId: string
  userId: string
}

/** 审核申请请求 */
export interface AuditApplyRequest {
  voteId: string
  applyId: string
  status: 'approved' | 'rejected'
}

/** 切换状态请求 */
export interface SwitchStatusRequest {
  voteId: string
  newStatus: JuryStatus
}

/** 切换状态响应 */
export interface SwitchStatusResponse {
  message: string
  newStatus: JuryStatus
}

/** 算票请求 */
export interface CalculateRequest {
  voteId: string
}

/** 算票响应 */
export interface CalculateResponse {
  message: string
  needNextRound: boolean
  nextRound?: number
  nextRoundUsers?: string[]
  results: Record<string, number>
  winner?: string
}

/** 申请加入评审团请求 */
export interface ApplyJuryRequest {
  voteId: string
  reason: string
}

/** 评审团投票请求 */
export interface JuryVoteRequest {
  voteId: string
  toUserId: string
  comment?: string
}

/** 评审团投票响应 */
export interface JuryVoteResponse {
  message: string
  remaining: number
}

/** 获取投票结果响应 */
export interface GetResultResponse {
  status: JuryStatus
  currentRound: number
  results: RoundResult[]
  members: JuryMember[]
}

/** 获取我的申请响应 */
export interface GetMyApplyResponse {
  applies: {
    id: string
    reason: string
    status: JuryApplyStatus
    adminId: string
    created: string
  }[]
  isMember: boolean
}

/** 文章信息 */
export interface ArticleInfo {
  id: string
  oId: string
  title: string
  viewCount: number
  goodCnt: number
  commentCount: number
  collectCnt: number
  thankCnt: number
}

/** 候选人信息 */
export interface CandidateInfo {
  userId: string
  user: UserInfo | null
  articles: ArticleInfo[]
}

/** 获取候选人响应 */
export interface GetCandidatesResponse {
  candidates: CandidateInfo[]
  currentRound: number
  totalVotes: number
  usedVotes: number
  remainingVotes: number
  allowRepeat: boolean
  votedUsers: Record<string, number>
}

/** 投票详情记录 */
export interface VoteRecord {
  toUserId: string
  toUser: UserInfo | null
  times: number
  comment: string
  created: string
}

/** 成员投票详情 */
export interface MemberVoteDetail {
  userId: string
  user: UserInfo | null
  hasVoted: boolean
  voteCount: number
  votes: VoteRecord[]
}

/** 获取投票详情响应 */
export interface GetVoteDetailsResponse {
  currentRound: number
  memberDetails: MemberVoteDetail[]
}
