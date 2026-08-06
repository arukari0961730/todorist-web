import type { PullRequestShare, PullRequestStatus } from '../types'
import { apiRequest } from './client'

export interface PullRequestInput {
  title: string
  url: string
  assigneeId: string | null
  taskId: string | null
  status: PullRequestStatus
  memo: string | null
}

export const pullRequestsApi = {
  list: (teamId: string) =>
    apiRequest<{ items: PullRequestShare[] }>(`/teams/${teamId}/pull-requests`),
  create: (teamId: string, input: PullRequestInput) =>
    apiRequest<PullRequestShare>(`/teams/${teamId}/pull-requests`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (shareId: string, input: PullRequestInput & { version: number }) =>
    apiRequest<PullRequestShare>(`/pull-requests/${shareId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (shareId: string, version: number) =>
    apiRequest<void>(`/pull-requests/${shareId}?version=${version}`, { method: 'DELETE' }),
}
