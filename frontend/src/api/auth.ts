import { apiRequest } from './client'
import type { User } from '../types'

export interface RegisterInput {
  name: string
  email: string
  password: string
  passwordConfirmation: string
}

export interface LoginInput {
  email: string
  password: string
}

export const authApi = {
  me: () => apiRequest<{ user: User }>('/auth/me'),
  register: (input: RegisterInput) =>
    apiRequest<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  login: (input: LoginInput) =>
    apiRequest<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
}
