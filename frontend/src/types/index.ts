export interface User {
  id: string
  name: string
  email: string
}

export type TeamRole = 'owner' | 'member'

export interface Team {
  id: string
  name: string
  timezone: string
  version: number
  role: TeamRole
  membershipId?: string
  memberCount?: number
  taskCount?: number
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  role: TeamRole
  version: number
  createdAt: string
  user: User
}

export interface Invitation {
  id: string
  email: string
  expiresAt: string
  createdAt: string
  createdBy: Pick<User, 'id' | 'name'>
}

export const taskStatuses = ['todo', 'working', 'review', 'fix', 'done'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: '未着手',
  working: '作業中',
  review: '確認中',
  fix: '修正中',
  done: '完了',
}

export interface Task {
  id: string
  teamId: string
  title: string
  description: string | null
  assigneeId: string | null
  createdById: string | null
  startDate: string
  deadline: string
  status: TaskStatus
  version: number
  createdAt: string
  updatedAt: string
  assignee: User | null
  createdBy: Pick<User, 'id' | 'name'> | null
}

export interface TaskComment {
  id: string
  taskId: string
  userId: string | null
  message: string
  createdAt: string
  updatedAt: string
  user: Pick<User, 'id' | 'name'> | null
}

export interface ChatMessage {
  id: string
  teamId: string
  userId: string | null
  message: string
  createdAt: string
  updatedAt: string
  user: Pick<User, 'id' | 'name'> | null
}

export const pullRequestStatuses = ['draft', 'review', 'fixing', 'merged', 'closed'] as const
export type PullRequestStatus = (typeof pullRequestStatuses)[number]

export const pullRequestStatusLabels: Record<PullRequestStatus, string> = {
  draft: '下書き',
  review: 'レビュー待ち',
  fixing: '修正対応中',
  merged: 'マージ済み',
  closed: 'クローズ',
}

export interface PullRequestShare {
  id: string
  teamId: string
  taskId: string | null
  title: string
  url: string
  assigneeId: string | null
  status: PullRequestStatus
  memo: string | null
  createdById: string | null
  version: number
  createdAt: string
  updatedAt: string
  task: Pick<Task, 'id' | 'title'> | null
  assignee: User | null
  createdBy: Pick<User, 'id' | 'name'> | null
}
