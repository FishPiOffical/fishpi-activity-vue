/**
 * 评审团投票相关接口
 */

import { BASE_URL } from '@/config'
import type {
  GetJuryInfoResponse,
  CreateUserRequest,
  CreateUserResponse,
  AddMemberRequest,
  AddMemberResponse,
  AuditApplyRequest,
  SwitchStatusRequest,
  SwitchStatusResponse,
  CalculateRequest,
  CalculateResponse,
  ApplyJuryRequest,
  JuryVoteRequest,
  JuryVoteResponse,
  GetResultResponse,
} from '@/types'
import { pb } from './pocketbase'

const API_BASE = `${BASE_URL}/backend/vote/jury`

/**
 * 获取请求头（包含认证信息）
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (pb.authStore.token) {
    headers['Authorization'] = pb.authStore.token
  }
  return headers
}

/**
 * 通用请求处理
 */
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `请求失败 (${response.status})`)
  }

  return data as T
}

/**
 * 获取评审团详情
 */
export async function getJuryInfo(voteId: string): Promise<GetJuryInfoResponse> {
  return request<GetJuryInfoResponse>(`${API_BASE}/info/${voteId}`)
}

/**
 * 通过用户名创建用户
 */
export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  return request<CreateUserResponse>(`${API_BASE}/user/create`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 添加评审团成员
 */
export async function addMember(data: AddMemberRequest): Promise<AddMemberResponse> {
  return request<AddMemberResponse>(`${API_BASE}/member/add`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 审核申请
 */
export async function auditApply(data: AuditApplyRequest): Promise<{ message: string }> {
  return request<{ message: string }>(`${API_BASE}/apply/audit`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 切换状态
 */
export async function switchStatus(data: SwitchStatusRequest): Promise<SwitchStatusResponse> {
  return request<SwitchStatusResponse>(`${API_BASE}/status/switch`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 手动触发算票
 */
export async function calculate(data: CalculateRequest): Promise<CalculateResponse> {
  return request<CalculateResponse>(`${API_BASE}/calculate`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 申请加入评审团
 */
export async function applyJury(data: ApplyJuryRequest): Promise<{ message: string }> {
  return request<{ message: string }>(`${API_BASE}/apply`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 评审团成员投票
 */
export async function juryVote(data: JuryVoteRequest): Promise<JuryVoteResponse> {
  return request<JuryVoteResponse>(`${API_BASE}/vote`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 获取投票结果
 */
export async function getResult(voteId: string): Promise<GetResultResponse> {
  return request<GetResultResponse>(`${API_BASE}/result/${voteId}`)
}

export default {
  getJuryInfo,
  createUser,
  addMember,
  auditApply,
  switchStatus,
  calculate,
  applyJury,
  juryVote,
  getResult,
}
