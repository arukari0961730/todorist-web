export interface ApiFieldError {
  field?: string
  code: string
  message: string
}

export class ApiError extends Error {
  statusCode: number
  code: string
  errors?: ApiFieldError[]
  requestId?: string

  constructor(payload: {
    statusCode?: number
    code?: string
    message?: string
    errors?: ApiFieldError[]
    requestId?: string
  }) {
    super(payload.message ?? '通信に失敗しました')
    this.name = 'ApiError'
    this.statusCode = payload.statusCode ?? 500
    this.code = payload.code ?? 'NETWORK_ERROR'
    this.errors = payload.errors
    this.requestId = payload.requestId
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError({
      statusCode: 0,
      code: 'NETWORK_ERROR',
      message: 'サーバーへ接続できません',
    })
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new ApiError({ ...payload, statusCode: response.status })
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
