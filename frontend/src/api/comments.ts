import type { TaskComment } from '../types'
import { apiRequest } from './client'

export const commentsApi = {
  list: (taskId: string) => apiRequest<{ items: TaskComment[] }>(`/tasks/${taskId}/comments`),
  create: (taskId: string, message: string) => apiRequest<TaskComment>(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
  remove: (commentId: string) => apiRequest<void>(`/comments/${commentId}`, { method: 'DELETE' }),
}
