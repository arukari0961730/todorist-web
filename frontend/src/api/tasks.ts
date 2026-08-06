import { apiRequest } from './client'
import type { Task, TaskStatus } from '../types'

export interface TaskInput {
  title: string
  description: string | null
  assigneeId: string | null
  startDate: string
  deadline: string
  status: TaskStatus
}

interface TaskListParams {
  search?: string
  status?: TaskStatus
  assigneeId?: string
  unassigned?: boolean
  deadlineScope?: 'overdue' | 'today' | 'upcoming'
  sort?: 'deadline' | 'startDate' | 'title' | 'assignee' | 'status'
  order?: 'asc' | 'desc'
}

export const tasksApi = {
  list: (teamId: string, params: TaskListParams = {}) => {
    const query = new URLSearchParams({
      limit: '100',
      sort: params.sort ?? 'deadline',
      order: params.order ?? 'asc',
    })
    const search = params.search?.trim()
    if (search) query.set('search', search)
    if (params.status) query.set('status', params.status)
    if (params.assigneeId) query.set('assigneeId', params.assigneeId)
    if (params.unassigned) query.set('unassigned', 'true')
    if (params.deadlineScope) query.set('deadlineScope', params.deadlineScope)

    return apiRequest<{ items: Task[]; nextCursor: string | null }>(
      `/teams/${teamId}/tasks?${query.toString()}`,
    )
  },
  create: (teamId: string, input: TaskInput) =>
    apiRequest<Task>(`/teams/${teamId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (taskId: string, input: Partial<TaskInput> & { version: number }) =>
    apiRequest<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (taskId: string, version: number) =>
    apiRequest<void>(`/tasks/${taskId}?version=${version}`, { method: 'DELETE' }),
}
