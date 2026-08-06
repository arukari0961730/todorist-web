import type { ChatMessage } from '../types'
import { apiRequest } from './client'

export const chatApi = {
  list: (teamId: string) => apiRequest<{ items: ChatMessage[] }>(`/teams/${teamId}/messages`),
  create: (teamId: string, message: string) => apiRequest<ChatMessage>(`/teams/${teamId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
  remove: (messageId: string) => apiRequest<void>(`/messages/${messageId}`, { method: 'DELETE' }),
}
